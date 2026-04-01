export const jwtConfig = {
    secret: process.env.JWT_SECRET || '!@WQTVFDGHJK%^&*$%^KJHGFqwqkbnvksdbfq765765elmcxnvkjdsfhg',
    expiresIn: "24h" as const,
};