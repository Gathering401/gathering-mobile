export enum Repetition {
    none = 1,
    annually = 2,
    monthly = 3,
    weekly = 4
}

export const getRepetitionById = (repetition: Repetition) => Object.entries(Repetition).find(([_, value]) => repetition === value)![0];

export const getRepetitionByValue = (repetition: string) => Object.entries(Repetition).find(([key, _]) => repetition === key)![1];

export const getRepetitionOptions = () => [
    { label: 'None', value: 'none' },
    { label: 'Annually', value: 'annually' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Weekly', value: 'weekly' }
];
