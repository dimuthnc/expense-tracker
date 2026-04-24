import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppDispatch, useAppState } from '@/state/AppContext';

export function CycleSelector() {
  const { cycleStart, cycleEnd } = useAppState();
  const dispatch = useAppDispatch();

  return (
    <Card className="mb-7 flex flex-wrap items-end gap-5 p-4">
      <h2 className="m-0 flex items-center gap-2 text-base font-semibold tracking-wide">
        Billing Cycle
        <span className="ml-1 inline-flex gap-1">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-7 w-7"
            title="Previous Cycle"
            aria-label="Previous Cycle"
            onClick={() => dispatch({ type: 'SHIFT_CYCLE', delta: -1 })}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-7 w-7"
            title="Next Cycle"
            aria-label="Next Cycle"
            onClick={() => dispatch({ type: 'SHIFT_CYCLE', delta: 1 })}
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
        </span>
      </h2>

      <div className="flex min-w-[160px] flex-col gap-1.5">
        <Label htmlFor="cycleFrom" className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Cycle From
        </Label>
        <Input
          id="cycleFrom"
          type="date"
          value={cycleStart}
          onChange={(e) =>
            dispatch({ type: 'SET_CYCLE', start: e.target.value, end: cycleEnd })
          }
        />
      </div>
      <div className="flex min-w-[160px] flex-col gap-1.5">
        <Label htmlFor="cycleTo" className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Cycle To
        </Label>
        <Input
          id="cycleTo"
          type="date"
          value={cycleEnd}
          onChange={(e) =>
            dispatch({ type: 'SET_CYCLE', start: cycleStart, end: e.target.value })
          }
        />
      </div>
    </Card>
  );
}
