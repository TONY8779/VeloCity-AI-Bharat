// AWS API call metrics middleware and tracker

const metricsStore = {
    calls: [],
    totalCalls: 0,
    totalErrors: 0,
    sessionStart: new Date().toISOString(),
};

export function awsMetrics(service, endpoint) {
    return (req, res, next) => {
        const start = Date.now();
        const originalJson = res.json.bind(res);

        res.json = (data) => {
            const responseTime = Date.now() - start;
            const isError = res.statusCode >= 400;

            const metric = {
                service,
                endpoint,
                method: req.method,
                responseTime,
                status: isError ? 'error' : 'success',
                statusCode: res.statusCode,
                timestamp: new Date().toISOString(),
            };

            metricsStore.calls.push(metric);
            metricsStore.totalCalls++;
            if (isError) metricsStore.totalErrors++;

            // Keep only last 200 calls in memory
            if (metricsStore.calls.length > 200) {
                metricsStore.calls = metricsStore.calls.slice(-200);
            }

            return originalJson(data);
        };

        next();
    };
}

export function getMetrics() {
    const last50 = metricsStore.calls.slice(-50);
    const avgResponseTime = last50.length > 0
        ? Math.round(last50.reduce((sum, c) => sum + c.responseTime, 0) / last50.length)
        : 0;

    // Service breakdown
    const serviceBreakdown = {};
    for (const call of metricsStore.calls) {
        if (!serviceBreakdown[call.service]) {
            serviceBreakdown[call.service] = { calls: 0, errors: 0, avgTime: 0, times: [] };
        }
        serviceBreakdown[call.service].calls++;
        if (call.status === 'error') serviceBreakdown[call.service].errors++;
        serviceBreakdown[call.service].times.push(call.responseTime);
    }
    for (const svc of Object.values(serviceBreakdown)) {
        svc.avgTime = Math.round(svc.times.reduce((s, t) => s + t, 0) / svc.times.length);
        delete svc.times;
    }

    return {
        totalCalls: metricsStore.totalCalls,
        totalErrors: metricsStore.totalErrors,
        sessionStart: metricsStore.sessionStart,
        avgResponseTime,
        serviceBreakdown,
        recentCalls: last50.map(c => ({
            service: c.service,
            endpoint: c.endpoint,
            responseTime: c.responseTime,
            status: c.status,
            timestamp: c.timestamp,
        })),
    };
}
