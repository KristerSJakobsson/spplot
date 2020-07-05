
Payoff Styles:
fixed
 - Simples payoff style, a fixed coupon is paid if a barrier is reached.
 - No supplementary data needed.
fixedWithMemoryFromValue
 - Same as fixed with a memory feature. The memory feature will recover a specified payoff absolute value for each missed payoff.
 - Needs the memory value as supplementary data: `memoryFromValue`
fixedWithMemoryFromPayoffLevel
 - Same as fixed with a memory feature. The memory feature will recover a specified payoff level for each missed payoff.
 - Needs the index for the payoff level as supplementary data: `memoryFromPayoff`
relativeToValue
 - The payoff will be relative to a specified value.
 - Needs the relative value for the payoff level as supplementary data: `relativeToValue`
relativeToBarrier
 - The payoff will be relative to a specified barrier.
 - Needs the index for the barrier level as supplementary data: `relativeToBarrier`
rangeAccrual
 - TODO: Not implemented yet...
