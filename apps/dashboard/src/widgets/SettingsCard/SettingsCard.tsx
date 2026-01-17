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

const SettingsCard = () => {
  const [name, setName] = React.useState('');
  const [desc, setDesc] = React.useState('');
  return (
    <Card className="w-full ">
      <CardHeader>
        <CardTitle className={'text-xl'}>Settings</CardTitle>
      </CardHeader>
      <CardContent className={'flex flex-col gap-5'}>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className={'text-l'}>General</CardTitle>
            <CardDescription>
              Basic chatbot identity and messaging
            </CardDescription>
          </CardHeader>
          <CardContent className={'flex-col gap-5 flex'}>
            <div className="grid gap-2 ">
              <Label htmlFor="chatbot-name">Chatbot name</Label>
              <Input
                id="chatbot-name"
                placeholder="Customer Support Bot"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2 ">
              <Label htmlFor="chatbot-desc">Welcome Message</Label>
              <Input
                id="chatbot-desc"
                placeholder="Hello! How can I help you today?"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
            <div className="grid gap-2 ">
              <Label htmlFor="chatbot-name">Input Placeholder</Label>
              <Input
                id="chatbot-name"
                placeholder="Type your message..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          </CardContent>
        </Card>
        <AppearanceCard />
      </CardContent>
    </Card>
  );
};
export default SettingsCard;
