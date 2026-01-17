import { Button } from '@knowbase/ui/components/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { Input } from '@knowbase/ui/components/input';
import { Label } from '@knowbase/ui/components/label';
import * as React from 'react';
import AppearanceCard from '@/widgets/AppearanceCard/AppearanceCard.tsx';
import GeneralCard from '@/widgets/GeneralCard/GeneralCard.tsx';

const SettingsCard = () => {
  return (
    <Card className="w-full ">
      <CardHeader>
        <CardTitle className={'text-xl'}>Settings</CardTitle>
      </CardHeader>
      <CardContent className={'flex flex-col gap-5'}>
        <GeneralCard />
        <AppearanceCard />
        <Button>Save Settings</Button>
      </CardContent>
    </Card>
  );
};
export default SettingsCard;
