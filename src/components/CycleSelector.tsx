import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppDispatch, useAppState } from '@/state/AppContext';
import { computeSummary } from '@/state/selectors';

/** The cycle window is a human decision, so the panel carries the amber bar. */
export function CycleSelector() {
  const state = useAppState();
  const { cycleStart, cycleEnd } = state;
  const dispatch = useAppDispatch();
  const { daysRemaining } = computeSummary(state);

  return (
    <Card className="mb-5 flex flex-wrap items-end gap-x-8 gap-y-5 border-l-bar border-l-human p-5 pl-6">
      <div className="flex flex-col gap-2">
        <span className="fx-label">Billing cycle</span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            title="Previous cycle"
            aria-label="Previous cycle"
            onClick={() => dispatch({ type: 'SHIFT_CYCLE', delta: -1 })}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            title="Next cycle"
            aria-label="Next cycle"
            onClick={() => dispatch({ type: 'SHIFT_CYCLE', delta: 1 })}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex min-w-[160px] flex-col gap-2">
        <Label htmlFor="cycleFrom">Cycle from</Label>
        <Input
          id="cycleFrom"
          type="date"
          value={cycleStart}
          className="fx-figure"
          onChange={(e) =>
            dispatch({ type: 'SET_CYCLE', start: e.target.value, end: cycleEnd })
          }
        />
      </div>
      <div className="flex min-w-[160px] flex-col gap-2">
        <Label htmlFor="cycleTo">Cycle to</Label>
        <Input
          id="cycleTo"
          type="date"
          value={cycleEnd}
          className="fx-figure"
          onChange={(e) =>
            dispatch({ type: 'SET_CYCLE', start: cycleStart, end: e.target.value })
          }
        />
      </div>

      <div className="ml-auto flex flex-col gap-2">
        <span className="fx-label">Days left</span>
        <span className="fx-figure font-display text-lead font-semibold leading-none text-human">
          {daysRemaining}
        </span>
      </div>
    </Card>
  );
}
