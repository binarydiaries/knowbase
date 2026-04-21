import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { Input } from '@knowbase/ui/components/input';
import { Label } from '@knowbase/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@knowbase/ui/components/select';
import * as React from 'react';

const AppearanceCard = () => {
  const [primaryColor, setPrimaryColor] = React.useState('#915964');
  const [widgetPosition, setWidgetPosition] = React.useState('bottom-right');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize how your agent looks</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Primary Color */}
        <div className="space-y-2">
          <Label>Primary Color</Label>

          <div className="flex items-center gap-3">
            {/* Color input */}
            <Input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-14 cursor-pointer p-1"
            />

            {/* Hex input */}
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="max-w-[140px]"
            />
          </div>
        </div>

        {/* Widget Position */}
        <div className="space-y-2">
          <Label>Widget Position</Label>

          <Select value={widgetPosition} onValueChange={setWidgetPosition}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select position" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="bottom-right">Bottom Right</SelectItem>
              <SelectItem value="bottom-left">Bottom Left</SelectItem>
              <SelectItem value="top-right">Top Right</SelectItem>
              <SelectItem value="top-left">Top Left</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppearanceCard;
