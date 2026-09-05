import { useAppState } from '@/state/AppContext';
import { ConfigList } from './ConfigList';

export function ConfigSection() {
  const state = useAppState();
  return (
    <section className="mb-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ConfigList
          title="Categories"
          listKey="categories"
          items={state.categories}
          placeholder="New category"
        />
        <ConfigList
          title="Card payment methods"
          listKey="cardPaymentMethods"
          items={state.cardPaymentMethods}
          placeholder="New card"
        />
        <ConfigList
          title="Cash payment methods"
          listKey="cashPaymentMethods"
          items={state.cashPaymentMethods}
          placeholder="New cash method"
        />
      </div>
      <p className="mt-4 max-w-[62ch] border-l-bar border-l-thought pl-4 text-small text-ink-dim">
        Removing an item does not erase existing row values. Those rows keep the old value, marked
        as legacy, until you edit them.
      </p>
    </section>
  );
}
