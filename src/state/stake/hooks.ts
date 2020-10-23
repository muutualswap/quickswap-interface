import { ChainId, CurrencyAmount, JSBI, Token, TokenAmount, Pair } from '@uniswap/sdk'
import { useMemo } from 'react'
import { UNI, EASY, USDC, ETHER, eUSDC, eUSDT, eDAI, UNITOKEN, QUICK, DAI } from '../../constants'
import { STAKING_REWARDS_INTERFACE } from '../../constants/abis/staking-rewards'
import { useActiveWeb3React } from '../../hooks'
import { NEVER_RELOAD, useMultipleContractSingleData } from '../multicall/hooks'
import { tryParseAmount } from '../swap/hooks'

export const STAKING_GENESIS = 1603467900

export const REWARDS_DURATION_DAYS = 14

// TODO add staking rewards addresses here
export const STAKING_REWARDS_INFO: {
  [chainId in ChainId]?: {
    tokens: [Token, Token]
    stakingRewardAddress: string
    ended: boolean
    index: Number
  }[]
} = {
  [ChainId.MATIC]: [//TODO: MATIC
    {
      tokens: [QUICK, DAI],
      stakingRewardAddress: '0xcd7A989C8a21871ff9Da645F74916e23b7b83601',
      ended: false,
      index: 0
      //STAKINGREWARDSFACTORY- 0x17D0a95553625CfF6A7320c69aD0060969331e39
    },
    {
      tokens: [QUICK, USDC],
      stakingRewardAddress: '0x7341554a23A89a97186f339597AE365bBB0c4a26',
      ended: false,
      index: 0
      //STAKINGREWARDSFACTORY- 0x17D0a95553625CfF6A7320c69aD0060969331e39
    },
    {
      tokens: [QUICK, UNITOKEN],
      stakingRewardAddress: '0x7d59413E87dA59552a662103782CcA860Dc3d3c4',
      ended: false,
      index: 0
      //STAKINGREWARDSFACTORY- 0x17D0a95553625CfF6A7320c69aD0060969331e39
    },
    {
      tokens: [ETHER, USDC],
      stakingRewardAddress: '0xf91056D1A58a38A783a4F6122A1F995EEE4f60B3',
      ended: false,
      index: 0
      //STAKINGREWARDSFACTORY- 0x17D0a95553625CfF6A7320c69aD0060969331e39
    },
    {
      tokens: [ETHER, DAI],
      stakingRewardAddress: '0x88d4D1a7A0E917DB41De09A1AcA437726c1C418a',
      ended: false,
      index: 0
      //STAKINGREWARDSFACTORY- 0x17D0a95553625CfF6A7320c69aD0060969331e39
    },
    {
      tokens: [EASY, UNITOKEN],
      stakingRewardAddress: '0xfbEed0206635479BD2Ac204F793BF10E7EEad9df',
      ended: false,
      index: 0
      //STAKINGREWARDSFACTORY- 0x17D0a95553625CfF6A7320c69aD0060969331e39
    },
    {
      tokens: [ETHER, USDC],
      stakingRewardAddress: '0x0cc1c20c8A5640aeFdD41b2aa3E8Dc2c2EdcDDbD',
      ended: true,
      index: 1
      //STAKINGREWARDSFACTORY- 0x80F13018Eb0CbD2579924Eb8039C5d36E467EB49
    },
    {
      tokens: [EASY, USDC],
      stakingRewardAddress: '0xE769875f9F0e38b15c9f409F08B583f00d2B14d3',
      ended: true,
      index: 0
      //STAKINGREWARDSFACTORY- 0x80F13018Eb0CbD2579924Eb8039C5d36E467EB49
    },
    {
      tokens: [eUSDC, UNITOKEN],
      stakingRewardAddress: '0x1D43445c82795E4Cc8eF7C3cd735a10C112332A7',
      ended: true,
      index: 0
      //STAKINGREWARDSFACTORY- 0x80F13018Eb0CbD2579924Eb8039C5d36E467EB49
    },
    {
      tokens: [eUSDT, UNITOKEN],
      stakingRewardAddress: '0xD929bbbd983b334D9D638DeC49DF454c3Ee720d9',
      ended: true,
      index: 0
      //STAKINGREWARDSFACTORY- 0x80F13018Eb0CbD2579924Eb8039C5d36E467EB49
    },
    {
      tokens: [eDAI, UNITOKEN],
      stakingRewardAddress: '0xFA190551895cc065EE48E2E36c7cd0F2ae01AED2',
      ended: true,
      index: 0
      //STAKINGREWARDSFACTORY- 0x80F13018Eb0CbD2579924Eb8039C5d36E467EB49
    },
    {
      tokens: [QUICK, USDC],
      stakingRewardAddress: '0x457d88690e0B543445e69c03b5a760b38Ce07078',
      ended: true,
      index: 1
      //STAKINGREWARDSFACTORY- 0x80F13018Eb0CbD2579924Eb8039C5d36E467EB49
    }
    
  ]
}

export interface StakingInfo {
  // the address of the reward contract
  stakingRewardAddress: string
  // the tokens involved in this pair
  tokens: [Token, Token]
  // the amount of token currently staked, or undefined if no account
  stakedAmount: TokenAmount
  // the amount of reward token earned by the active account, or undefined if no account
  earnedAmount: TokenAmount
  // the total amount of token staked in the contract
  totalStakedAmount: TokenAmount
  // the amount of token distributed per second to all LPs, constant
  totalRewardRate: TokenAmount
  // the current amount of token distributed to the active account per second.
  // equivalent to percent of total supply * reward rate
  rewardRate: TokenAmount
  // when the period ends
  periodFinish: Date | undefined

  ended: boolean

  index: Number
  // calculates a hypothetical amount of token distributed to the active account per second.
  getHypotheticalRewardRate: (
    stakedAmount: TokenAmount,
    totalStakedAmount: TokenAmount,
    totalRewardRate: TokenAmount
  ) => TokenAmount
}

// gets the staking info from the network for the active chain id
export function useStakingInfo(pairToFilterBy?: Pair | null): StakingInfo[] {
  const { chainId, account } = useActiveWeb3React()

  const info = useMemo(
    () =>
      chainId
        ? STAKING_REWARDS_INFO[chainId]?.filter(stakingRewardInfo =>
            pairToFilterBy === undefined
              ? true
              : pairToFilterBy === null
              ? false
              : pairToFilterBy.involvesToken(stakingRewardInfo.tokens[0]) &&
                pairToFilterBy.involvesToken(stakingRewardInfo.tokens[1])
          ) ?? []
        : [],
    [chainId, pairToFilterBy]
  )

  const uni = chainId ? UNI[chainId] : undefined

  const rewardsAddresses = useMemo(() => info.map(({ stakingRewardAddress }) => stakingRewardAddress), [info])

  const accountArg = useMemo(() => [account ?? undefined], [account])

  // get all the info from the staking rewards contracts
  const balances = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'balanceOf', accountArg)
  const earnedAmounts = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'earned', accountArg)
  const totalSupplies = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'totalSupply')

  // tokens per second, constants
  const rewardRates = useMultipleContractSingleData(
    rewardsAddresses,
    STAKING_REWARDS_INTERFACE,
    'rewardRate',
    undefined,
    NEVER_RELOAD
  )
  const periodFinishes = useMultipleContractSingleData(
    rewardsAddresses,
    STAKING_REWARDS_INTERFACE,
    'periodFinish',
    undefined,
    NEVER_RELOAD
  )

  return useMemo(() => {
    if (!chainId || !uni) return []

    return rewardsAddresses.reduce<StakingInfo[]>((memo, rewardsAddress, index) => {
      // these two are dependent on account
      const balanceState = balances[index]
      const earnedAmountState = earnedAmounts[index]

      // these get fetched regardless of account
      const totalSupplyState = totalSupplies[index]
      const rewardRateState = rewardRates[index]
      const periodFinishState = periodFinishes[index]

      if (
        // these may be undefined if not logged in
        !balanceState?.loading &&
        !earnedAmountState?.loading &&
        // always need these
        totalSupplyState &&
        !totalSupplyState.loading &&
        rewardRateState &&
        !rewardRateState.loading &&
        periodFinishState &&
        !periodFinishState.loading
      ) {
        if (
          balanceState?.error ||
          earnedAmountState?.error ||
          totalSupplyState.error ||
          rewardRateState.error ||
          periodFinishState.error
        ) {
          console.error('Failed to load staking rewards info')
          return memo
        }

        // get the LP token
        const tokens = info[index].tokens
        const dummyPair = new Pair(new TokenAmount(tokens[0], '0'), new TokenAmount(tokens[1], '0'))

        // check for account, if no account set to 0

        const stakedAmount = new TokenAmount(dummyPair.liquidityToken, JSBI.BigInt(balanceState?.result?.[0] ?? 0))
        const totalStakedAmount = new TokenAmount(dummyPair.liquidityToken, JSBI.BigInt(totalSupplyState.result?.[0]))
        const totalRewardRate = new TokenAmount(uni, JSBI.BigInt(rewardRateState.result?.[0]))

        const getHypotheticalRewardRate = (
          stakedAmount: TokenAmount,
          totalStakedAmount: TokenAmount,
          totalRewardRate: TokenAmount
        ): TokenAmount => {
          return new TokenAmount(
            uni,
            JSBI.greaterThan(totalStakedAmount.raw, JSBI.BigInt(0))
              ? JSBI.divide(JSBI.multiply(totalRewardRate.raw, stakedAmount.raw), totalStakedAmount.raw)
              : JSBI.BigInt(0)
          )
        }

        const individualRewardRate = getHypotheticalRewardRate(stakedAmount, totalStakedAmount, totalRewardRate)

        const periodFinishMs = periodFinishState.result?.[0]?.mul(1000)?.toNumber()

        memo.push({
          stakingRewardAddress: rewardsAddress,
          tokens: info[index].tokens,
          ended: info[index].ended,
          index: info[index].index,
          periodFinish: periodFinishMs > 0 ? new Date(periodFinishMs) : undefined,
          earnedAmount: new TokenAmount(uni, JSBI.BigInt(earnedAmountState?.result?.[0] ?? 0)),
          rewardRate: individualRewardRate,
          totalRewardRate: totalRewardRate,
          stakedAmount: stakedAmount,
          totalStakedAmount: totalStakedAmount,
          getHypotheticalRewardRate
        })
      }
      return memo
    }, [])
  }, [balances, chainId, earnedAmounts, info, periodFinishes, rewardRates, rewardsAddresses, totalSupplies, uni])
}

export function useTotalUniEarned(): TokenAmount | undefined {
  const { chainId } = useActiveWeb3React()
  const uni = chainId ? UNI[chainId] : undefined
  const stakingInfos = useStakingInfo()

  return useMemo(() => {
    if (!uni) return undefined
    return (
      stakingInfos?.reduce(
        (accumulator, stakingInfo) => accumulator.add(stakingInfo.earnedAmount),
        new TokenAmount(uni, '0')
      ) ?? new TokenAmount(uni, '0')
    )
  }, [stakingInfos, uni])
}

// based on typed value
export function useDerivedStakeInfo(
  typedValue: string,
  stakingToken: Token,
  userLiquidityUnstaked: TokenAmount | undefined
): {
  parsedAmount?: CurrencyAmount
  error?: string
} {
  const { account } = useActiveWeb3React()

  const parsedInput: CurrencyAmount | undefined = tryParseAmount(typedValue, stakingToken)

  const parsedAmount =
    parsedInput && userLiquidityUnstaked && JSBI.lessThanOrEqual(parsedInput.raw, userLiquidityUnstaked.raw)
      ? parsedInput
      : undefined

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }
  if (!parsedAmount) {
    error = error ?? 'Enter an amount'
  }

  return {
    parsedAmount,
    error
  }
}

// based on typed value
export function useDerivedUnstakeInfo(
  typedValue: string,
  stakingAmount: TokenAmount
): {
  parsedAmount?: CurrencyAmount
  error?: string
} {
  const { account } = useActiveWeb3React()

  const parsedInput: CurrencyAmount | undefined = tryParseAmount(typedValue, stakingAmount.token)

  const parsedAmount = parsedInput && JSBI.lessThanOrEqual(parsedInput.raw, stakingAmount.raw) ? parsedInput : undefined

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }
  if (!parsedAmount) {
    error = error ?? 'Enter an amount'
  }

  return {
    parsedAmount,
    error
  }
}