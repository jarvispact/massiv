module.exports = (result) => {
    const keys = Object.keys(result);
    const has2Properties = keys.length === 2;
    const hasStatusKey = keys.includes('status');
    const hasResponseKey = keys.includes('response');
    if (has2Properties && hasStatusKey && hasResponseKey) return result;
    return { status: 200, response: result };
};
