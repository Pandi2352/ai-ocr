export const getPagination = (page: number | string = 1, limit: number | string = 10) => {
    const pageNum = Math.max(1, typeof page === 'string' ? parseInt(page) : page);
    const limitNum = Math.max(1, typeof limit === 'string' ? parseInt(limit) : limit);
    const skip = (pageNum - 1) * limitNum;

    return {
        skip,
        limit: limitNum,
        page: pageNum,
    };
};
