import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json`, `_clist.json`, and all levels
 */
const dir = '/data';

// --- Fetch main list ---
export async function fetchList() {
    try {
        const listResult = await fetch(`${dir}/_list.json`);
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                try {
                    const levelResult = await fetch(`${dir}/list/${path}.json`);
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: level.records.sort((a, b) => b.percent - a.percent),
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error(`Failed to load main list.`);
        return null;
    }
}

// --- Fetch challenge list ---
export async function fetchChallengeList() {
    try {
        const listResult = await fetch(`${dir}/_clist.json`);
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                try {
                    const levelResult = await fetch(`${dir}/clist/${path}.json`);
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: level.records.sort((a, b) => b.percent - a.percent),
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load challenge level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error(`Failed to load challenge list.`);
        return null;
    }
}

// --- Fetch impossible list ---
export async function fetchIlist() {
    try {
        const listResult = await fetch(`${dir}/_ilist.json`);
        if (!listResult.ok) {
            throw new Error(`Failed to fetch ${dir}/_ilist.json — status ${listResult.status}`);
        }
        const list = await listResult.json();

        return await Promise.all(
            list.map(async (path, rank) => {
                const tried = [];

                // helper to try a folder and return { ok, res }
                async function tryFolder(folder) {
                    const url = `${dir}/${folder}/${path}.json`;
                    tried.push(url);
                    try {
                        // no-store to reduce caching confusion during debugging
                        const res = await fetch(url, { cache: 'no-store' });
                        console.debug(`[fetchIlist] tried ${url} -> ${res.status} ${res.statusText}`);
                        return { ok: res.ok, res, url };
                    } catch (err) {
                        // network/CORS errors end up here
                        console.error(`[fetchIlist] network error fetching ${url}:`, err);
                        return { ok: false, res: null, url, err };
                    }
                }

                try {
                    // Try ilist first, then list
                    let attempt = await tryFolder('ilist');
                    if (!attempt.ok) {
                        attempt = await tryFolder('list');
                    }

                    if (!attempt.ok || !attempt.res) {
                        console.error(`[fetchIlist] Failed to load ${path}. Tried: ${tried.join(', ')}`);
                        return [null, path];
                    }

                    // quick content-type check before parsing as JSON
                    const contentType = attempt.res.headers.get('content-type') || '';
                    if (!contentType.includes('application/json')) {
                        // try to get text for debugging
                        const txt = await attempt.res.text().catch(() => '[unable to read body]');
                        console.warn(`[fetchIlist] ${attempt.url} returned content-type='${contentType}'. Body preview:`, txt.slice(0, 200));
                        // If it's not JSON, treat as failure
                        return [null, path];
                    }

                    // parse JSON
                    let level;
                    try {
                        level = await attempt.res.json();
                    } catch (parseErr) {
                        const text = await attempt.res.text().catch(() => '[could not read body]');
                        console.error(`[fetchIlist] JSON parse error for ${attempt.url}:`, parseErr, 'body preview:', text.slice(0, 200));
                        return [null, path];
                    }

                    // guard: ensure records is an array
                    const records = Array.isArray(level.records) ? level.records : [];

                    return [
                        {
                            ...level,
                            path,
                            records: records.sort((a, b) => b.percent - a.percent),
                        },
                        null,
                    ];
                } catch (err) {
                    console.error(`Failed to load level #${rank + 1} ${path}:`, err);
                    return [null, path];
                }
            })
        );
    } catch (err) {
        console.error(`Failed to load impossible list:`, err);
        return null;
    }
}

// --- Fetch editors ---
export async function fetchEditors() {
    try {
        const editorsResult = await fetch(`${dir}/_editors.json`);
        return await editorsResult.json();
    } catch {
        return null;
    }
}

// --- Main leaderboard ---
export async function fetchLeaderboard() {
    const list = await fetchList();
    if (!list) return [[], []];

    const scoreMap = {};
    const errs = [];

    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }

        const verifier = Object.keys(scoreMap).find(u => u.toLowerCase() === level.verifier.toLowerCase()) || level.verifier;
        scoreMap[verifier] ??= { verified: [], completed: [], progressed: [] };
        scoreMap[verifier].verified.push({
            rank: rank + 1,
            level: level.name,
            score: score(rank + 1, 100, level.percentToQualify),
            link: level.verification,
        });

        level.records.forEach(record => {
            const user = Object.keys(scoreMap).find(u => u.toLowerCase() === record.user.toLowerCase()) || record.user;
            scoreMap[user] ??= { verified: [], completed: [], progressed: [] };
            if (record.percent === 100) {
                scoreMap[user].completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: score(rank + 1, 100, level.percentToQualify),
                    link: record.link,
                });
            } else {
                scoreMap[user].progressed.push({
                    rank: rank + 1,
                    level: level.name,
                    percent: record.percent,
                    score: score(rank + 1, record.percent, level.percentToQualify),
                    link: record.link,
                });
            }
        });
    });

    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const total = [scores.verified, scores.completed, scores.progressed].flat().reduce((sum, cur) => sum + cur.score, 0);
        return { user, total: round(total), ...scores };
    });

    return [res.sort((a, b) => b.total - a.total), errs];
}

// --- Challenge leaderboard ---
export async function fetchChallengeLeaderboard() {
    const list = await fetchChallengeList();
    if (!list) return [[], []];

    const scoreMap = {};
    const errs = [];

    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }

        const verifier = Object.keys(scoreMap).find(u => u.toLowerCase() === level.verifier.toLowerCase()) || level.verifier;
        scoreMap[verifier] ??= { verified: [], completed: [], progressed: [] };
        scoreMap[verifier].verified.push({
            rank: rank + 1,
            level: level.name,
            score: score(rank + 1, 100, level.percentToQualify),
            link: level.verification,
        });

        level.records.forEach(record => {
            const user = Object.keys(scoreMap).find(u => u.toLowerCase() === record.user.toLowerCase()) || record.user;
            scoreMap[user] ??= { verified: [], completed: [], progressed: [] };
            if (record.percent === 100) {
                scoreMap[user].completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: score(rank + 1, 100, level.percentToQualify),
                    link: record.link,
                });
            } else {
                scoreMap[user].progressed.push({
                    rank: rank + 1,
                    level: level.name,
                    percent: record.percent,
                    score: score(rank + 1, record.percent, level.percentToQualify),
                    link: record.link,
                });
            }
        });
    });

    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const total = [scores.verified, scores.completed, scores.progressed].flat().reduce((sum, cur) => sum + cur.score, 0);
        return { user, total: round(total), ...scores };
    });

    return [res.sort((a, b) => b.total - a.total), errs];
}
