# Expense profile

Private context for the expense-insights skill. Keep this beside the data, never in a git repository.
Mark anything you are unsure of as unconfirmed so an agent doesn't treat it as fact.

## Household

Who the people named in descriptions are.

## Money basics

Currency. Is income net of tax and retirement contributions? How often and when is it paid?

## How the cycle works

What the cycle dates and folder names mean.

## What recurring lines mean

For each fixed or recurring line: what it is, and whether the money is consumed or kept.

## Pass-through items

Things bought for others and repaid. The loader reads this table and matches each entry, ignoring case,
anywhere in a row's description. Keep entries specific enough not to catch your own spending.

| Description contains | Note |
|----------------------|------|
| Example item | Who repaid it |

## Known one-offs and expected events

Past spikes to set aside, and upcoming trips, renewals, and large purchases.

## Goals

Savings targets, or decisions the analysis should support.

## Category rollups

The loader reads this table. Merge categories whose meaning overlaps or changed over time.

| Category | Rollup |
|----------|--------|
| Example category | Example rollup |

## Open questions

Meanings still unresolved. Show results both ways if one of these moves a figure.
