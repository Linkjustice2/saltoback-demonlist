import { fetchList } from '../content.js';
import { getThumbnailFromId, getYoutubeIdFromUrl, shuffle } from '../util.js';

import Spinner from '../components/Spinner.js';
import Btn from '../components/Btn.js';

export default {
    components: { Spinner, Btn },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-roulette">
            <div class="sidebar">
                <p class="type-label-md" style="color: #aaa">
                    Shameless copy of the Extreme Demon Roulette by 
                    <a href="https://matcool.github.io/extreme-demon-roulette/" target="_blank">matcool</a>.
                </p>
                <form class="options">
                    <div class="check">
                        <input type="checkbox" id="demon" value="Demon List" v-model="useDemonList">
                        <label for="demon">Demon List</label>
                    </div>
                    <div class="check">
                        <input type="checkbox" id="challenge" value="Challenge List" v-model="useChallengeList">
                        <label for="challenge">Challenge List</label>
                    </div>
                    <Btn @click.native.prevent="onStart">{{ levels.length === 0 ? 'Start' : 'Restart'}}</Btn>
                </form>
                <p class="type-label-md" style="color: #aaa">
                    The roulette saves automatically.
                </p>
                <form class="save">
                    <p>Manual Load/Save</p>
                    <div class="btns">
                        <Btn @click.native.prevent="onImport">Import</Btn>
                        <Btn :disabled="!isActive" @click.native.prevent="onExport">Export</Btn>
                    </div>
                </form>
            </div>
            <section class="levels-container">
                <div class="levels">
                    <template v-if="levels.length > 0">
                        <!-- completed, current, results, and remaining levels unchanged -->
                    </template>
                </div>
            </section>
            <div class="toasts-container">
                <div class="toasts">
                    <div v-for="toast in toasts" class="toast">
                        <p>{{ toast }}</p>
                    </div>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        loading: false,
        levels: [],
        progression: [],
        percentage: undefined,
        givenUp: false,
        showRemaining: false,
        useDemonList: true,
        useChallengeList: true,
        toasts: [],
        fileInput: undefined,
    }),
    mounted() {
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = '.json';
        this.fileInput.addEventListener('change', this.onImportUpload);

        const roulette = JSON.parse(localStorage.getItem('roulette'));
        if (!roulette) return;

        this.levels = roulette.levels;
        this.progression = roulette.progression;
    },
    computed: {
        currentLevel() { return this.levels[this.progression.length]; },
        currentPercentage() { return this.progression[this.progression.length - 1] || 0; },
        placeholder() { return `At least ${this.currentPercentage + 1}%`; },
        hasCompleted() {
            return this.progression[this.progression.length - 1] >= 100 || this.progression.length === this.levels.length;
        },
        isActive() { return this.progression.length > 0 && !this.givenUp && !this.hasCompleted; },
    },
    methods: {
        shuffle,
        getThumbnailFromId,
        getYoutubeIdFromUrl,
        async onStart() {
            if (this.isActive) { this.showToast('Give up before starting a new roulette.'); return; }
            if (!this.useDemonList && !this.useChallengeList) return;

            this.loading = true;
            const fullList = await fetchList();
            if (fullList.filter(([_, err]) => err).length > 0) {
                this.loading = false;
                this.showToast('List is currently broken. Wait until it\'s fixed.');
                return;
            }

            const fullListMapped = fullList.map(([lvl, _], i) => ({
                rank: i + 1,
                id: lvl.id,
                name: lvl.name,
                video: lvl.verification,
            }));

            const list = [];
            if (this.useDemonList) list.push(...fullListMapped.slice(0, 75));       // Demon List
            if (this.useChallengeList) list.push(...fullListMapped.slice(75, 150));  // Challenge List

            this.levels = shuffle(list).slice(0, 100);
            this.showRemaining = false;
            this.givenUp = false;
            this.progression = [];
            this.percentage = undefined;
            this.loading = false;
        },
        save() { localStorage.setItem('roulette', JSON.stringify({ levels: this.levels, progression: this.progression })); },
        onDone() {
            if (!this.percentage || this.percentage <= this.currentPercentage || this.percentage > 100) {
                this.showToast('Invalid percentage.');
                return;
            }
            this.progression.push(this.percentage);
            this.percentage = undefined;
            this.save();
        },
        onGiveUp() { this.givenUp = true; localStorage.removeItem('roulette'); },
        onImport() { if (this.isActive && !window.confirm('Overwrite current roulette?')) return; this.fileInput.showPicker(); },
        async onImportUpload() {
            if (this.fileInput.files.length === 0) return;
            const file = this.fileInput.files[0];
            if (file.type !== 'application/json') { this.showToast('Invalid file.'); return; }
            try {
                const roulette = JSON.parse(await file.text());
                if (!roulette.levels || !roulette.progression) { this.showToast('Invalid file.'); return; }
                this.levels = roulette.levels;
                this.progression = roulette.progression;
                this.save();
                this.givenUp = false;
                this.showRemaining = false;
                this.percentage = undefined;
            } catch { this.showToast('Invalid file.'); }
        },
        onExport() {
            const file = new Blob([JSON.stringify({ levels: this.levels, progression: this.progression })], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(file);
            a.download = 'tsl_roulette';
            a.click();
            URL.revokeObjectURL(a.href);
        },
        showToast(msg) { this.toasts.push(msg); setTimeout(() => { this.toasts.shift(); }, 3000); },
    },
};
