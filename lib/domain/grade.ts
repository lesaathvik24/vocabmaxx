export const Grade = { Again: 0, Hard: 3, Good: 4, Easy: 5 } as const
export type Grade = typeof Grade[keyof typeof Grade]
export const GRADES = [Grade.Again, Grade.Hard, Grade.Good, Grade.Easy] as const
