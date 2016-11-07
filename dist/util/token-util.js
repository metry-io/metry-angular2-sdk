export function isValidToken(token) {
    return (token && token.expires_at > Date.now());
}
export function subaccountHeader(subaccount) {
    return subaccount ? { 'X-Subaccount': subaccount } : {};
}
export function organizationHeader(organization) {
    return organization ? { 'X-Organization': organization } : {};
}
