import { round, score } from './score.js';

const dir = '/data';

// --- Fetch main list ---
export async function fetchList() {
    try {
        const listResult = await fetch(`${dir}/_list.json`);
        const list = await listResult.json();

        return await Promise.all(
            list.map(async (path, rank) => {
                try {
                    // Try /list first, fallback to /ilist
                    let levelResult = await fetch(`${dir}/list/${path}.json`).catch(() => fetch(`${dir}/ilist/${path}.json`));
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
            })
        );
    } catch {
        console.error(`Failed to load main list.`);
        return null;
    }
}

// --- Fetch impossible list ---
export async function fetchIlist() {
    try {
        const results = await Promise.allSettled([
            fetch(`${dir}/_list.json`),
            fetch(`${dir}/_ilist.json`)
        ]);

        let list = [];

        if (results[0].status === 'fulfilled') {
            const arr = await results[0].value.json();
            list = list.concat(arr.map(path => ({ path, source: 'list' })));
        }

        if (results[1].status === 'fulfilled') {
            const arr = await results[1].value.json();
            list = list.concat(arr.map(path => ({ path, source: 'ilist' })));
        }

        return await Promise.all(
            list.map(async ({ path, source }, rank) => {
                try {
                    let levelResult;

                    if (source === 'ilist') {
                        levelResult = await fetch(`${dir}/ilist/${path}.json`).catch(() => fetch(`${dir}/list/${path}.json`));
                    } else {
                        levelResult = await fetch(`${dir}/list/${path}.json`).catch(() => fetch(`${dir}/ilist/${path}.json`));
                    }

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
