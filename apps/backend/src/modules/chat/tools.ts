import { tool } from 'ai';
import { z } from 'zod';
import type {
  LeadGenerationConfig,
  SchedulingConfig,
} from '../../db/schema/agentActions';
import { createBooking, getAvailableSlots } from '../../lib/calcom';
import { AppointmentService } from '../appointment/service';
import { CalcomConnectionService } from '../calcomConnection/service';

type SchedulingCtx = {
  agentId: string;
  conversationId: string;
  channelId: string;
  orgId: string;
};

export function buildLeadCaptureTool(config: LeadGenerationConfig) {
  const fields = config.fields ?? {
    name: { collect: true, required: true },
    email: { collect: true, required: true },
  };

  const schemaShape: Record<string, z.ZodTypeAny> = {};

  if (fields.name?.collect) {
    const base = z.string().describe("The user's full name");
    schemaShape.name = fields.name.required ? base : base.optional();
  }
  if (fields.email?.collect) {
    const base = z.string().email().describe("The user's email address");
    schemaShape.email = fields.email.required ? base : base.optional();
  }
  if (fields.phone?.collect) {
    const base = z.string().describe("The user's phone number");
    schemaShape.phone = fields.phone.required ? base : base.optional();
  }
  if (fields.company?.collect) {
    const base = z.string().describe("The user's company or organization");
    schemaShape.company = fields.company.required ? base : base.optional();
  }

  const triggerInstruction = config.triggerInstructions
    ? ` ${config.triggerInstructions}`
    : '';

  return tool({
    description: `Capture the user's contact information. Call this tool only after all required fields have been collected through conversation — check prior messages for values already provided and do not re-ask for them.${triggerInstruction}`,
    inputSchema: z.object(schemaShape),
    execute: async (_input) => ({ captured: true }),
  });
}

export function buildSchedulingTools(
  config: SchedulingConfig,
  ctx: SchedulingCtx,
  requestTimezone?: string,
) {
  const slotsToShow = config.slotsToShow ?? 6;
  const effectiveTz =
    config.timezone === 'auto'
      ? (requestTimezone ?? 'UTC')
      : (config.timezone ?? 'UTC');

  const get_available_slots = tool({
    description: `Fetch available appointment time slots. Call this when the user wants to schedule or book a meeting.${config.triggerInstructions ? ` ${config.triggerInstructions}` : ''}`,
    inputSchema: z.object({
      preferredDate: z
        .string()
        .optional()
        .describe(
          'Preferred date in YYYY-MM-DD format, if the user mentioned one',
        ),
    }),
    execute: async (input) => {
      const connection = await CalcomConnectionService.findByOrg(ctx.orgId);
      if (!connection) {
        return {
          slots: [],
          error: 'Appointment scheduling is not configured yet.',
        };
      }

      try {
        const now = new Date();
        const startDate =
          input.preferredDate ?? now.toISOString().split('T')[0];
        const end = new Date(startDate);
        end.setDate(end.getDate() + 7);
        const endDate = end.toISOString().split('T')[0];

        const result = await getAvailableSlots({
          calApiKey: connection.calApiKey,
          eventTypeId: config.eventTypeId,
          startDate,
          endDate,
          timezone: effectiveTz,
        });

        return {
          slots: result.slots.slice(0, slotsToShow),
          timezone: effectiveTz,
        };
      } catch (err) {
        console.error('[scheduling] getAvailableSlots error:', err);
        return {
          slots: [],
          error: 'Could not fetch available slots. Please try again later.',
        };
      }
    },
  });

  const book_appointment = tool({
    description:
      'Book a specific appointment slot after the user has confirmed the time, provided their name and email.',
    inputSchema: z.object({
      startTime: z.string().describe('ISO 8601 start time of the chosen slot'),
      attendeeName: z.string().describe("Attendee's full name"),
      attendeeEmail: z.string().email().describe("Attendee's email address"),
      notes: z.string().optional().describe('Optional notes for the meeting'),
    }),
    execute: async (input) => {
      const connection = await CalcomConnectionService.findByOrg(ctx.orgId);
      if (!connection) {
        return { error: 'Appointment scheduling is not configured yet.' };
      }

      try {
        const booking = await createBooking({
          calApiKey: connection.calApiKey,
          eventTypeId: config.eventTypeId,
          startTime: input.startTime,
          attendeeName: input.attendeeName,
          attendeeEmail: input.attendeeEmail,
          notes: input.notes,
          timezone: effectiveTz,
        });

        try {
          await AppointmentService.create({
            agentId: ctx.agentId,
            conversationId: ctx.conversationId,
            channelId: ctx.channelId,
            orgId: ctx.orgId,
            calBookingUid: booking.uid,
            attendeeName: input.attendeeName,
            attendeeEmail: input.attendeeEmail,
            startTime: new Date(booking.startTime),
            notes: input.notes ?? null,
          });
        } catch (dbErr) {
          console.error('[scheduling] DB persist error:', dbErr);
        }

        const message =
          config.confirmationMessage ?? 'Your appointment has been booked!';
        return {
          bookingUid: booking.uid,
          startTime: booking.startTime,
          message,
        };
      } catch (err) {
        console.error('[scheduling] createBooking error:', err);
        return {
          error: 'Booking failed. Please check the details and try again.',
        };
      }
    },
  });

  return { get_available_slots, book_appointment };
}
