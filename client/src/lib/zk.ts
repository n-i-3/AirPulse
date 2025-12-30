export async function generateIdentityCommitment(userId: string, secret: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(userId + secret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
