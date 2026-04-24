import { useAppState } from '@/state/AppContext';
import { ConfigList } from './ConfigList';

export function ConfigSection() {
  const state = useAppState();
  return (
    <section className="mb-8">
      <h2 className="mb-3 mt-0 text-lg font-semibold">Configuration</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <ConfigList
          title="Categories"
          listKey="categories"
          items={state.categories}
          placeholder="New category"
        />
        <ConfigList
          title="Card Payment Methods"
          listKey="cardPaymentMethods"
          items={state.cardPaymentMethods}
          placeholder="New card"
        />
        <ConfigList
          title="Cash Payment Methods"
          listKey="cashPaymentMethods"
          items={state.cashPaymentMethods}
          placeholder="New cash method"
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Removing an item does not erase existing row values; those rows will keep the old value
        (marked as legacy) until edited.
      </p>
    </section>
  );
}
