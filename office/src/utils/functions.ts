import { complement, isEmpty, isNil } from "ramda";

export const isNotEmpty = complement(isEmpty);
export const isNotNil = complement(isNil);
