export function issuePathStartsWith(issuePath: PropertyKey[], prefix: PropertyKey | PropertyKey[]): boolean {
    if (!Array.isArray(prefix)) prefix = [prefix];
    if (issuePath.length < prefix.length) return false;
    return prefix.every((segment, i) => issuePath[i] === segment);
}
