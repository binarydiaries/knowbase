import { Button } from '@knowbase/ui/components/button';
import { Separator } from '@knowbase/ui/components/separator';
import { Textarea } from '@knowbase/ui/components/textarea';
import { SendHorizonal, X } from 'lucide-react';
import iconSvg from './icon2.png';

export const Chatbot = () => {
  return (
    <div className="w-100 shadow-[0_0_15px_rgba(0,0,0,0.15)] rounded-3xl h-full overflow-hidden flex flex-col">
      <div className="flex bg-gray-950 h-18 px-5 items-center gap-5">
        <img src={iconSvg} alt="" className="size-10" />
        <div className="text-white flex-1">
          <h2 className="text-base font-semibold">Gini</h2>
          <p className="text-sm">Customer support assistance</p>
        </div>
        <Button size="icon-sm">
          <X className="text-white size-5" />
        </Button>
      </div>
      <Separator />
      <div className="flex-1"></div>
      <div className="p-5 flex flex-col gap-2">
        <div className="relative">
          <Textarea
            className="min-h-12 rounded-2xl pr-14 py-3 resize-none"
            placeholder="Type your message..."
          />
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-3 top-2"
          >
            <SendHorizonal className="size-6" />
          </Button>
        </div>
        <p className="text-xs text-center text-slate-300">
          Powered by <strong>Knowbase</strong>
        </p>
      </div>
    </div>
  );
};
