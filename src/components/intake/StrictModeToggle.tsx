import { Shield, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StrictModeToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function StrictModeToggle({ checked, onCheckedChange }: StrictModeToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <Label htmlFor="strictMode" className="text-base font-medium">Strict Mode</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-success">ON:</span>
                    <ul className="mt-1 ml-3 list-disc space-y-0.5 text-muted-foreground">
                      <li>Requires confidence ≥70%</li>
                      <li>All critical fields must be filled</li>
                      <li>No math errors allowed</li>
                    </ul>
                  </div>
                  <div>
                    <span className="font-semibold text-warning">OFF:</span>
                    <ul className="mt-1 ml-3 list-disc space-y-0.5 text-muted-foreground">
                      <li>Generates with warnings</li>
                      <li>Allows partial data</li>
                      <li>Shows "LOW CONFIDENCE" banner</li>
                    </ul>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <p className="text-sm text-muted-foreground">
            Require evidence citations for all claims. Flags unsupported assertions.
          </p>
        </div>
      </div>
      <Switch
        id="strictMode"
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
