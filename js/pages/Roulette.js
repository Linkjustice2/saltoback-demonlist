import { fetchList, fetchChallengeList } from '../content.js';
import { getThumbnailFromId, getYoutubeIdFromUrl, shuffle } from '../util.js';

import Spinner from '../components/Spinner.js';
import Btn from '../components/Btn.js';

export default {
    components: { Spinner, Btn },
    template: `
        <main v-if="loading"><Spinner></Spinner></main>
        <main v-else class="page-roulette">
            <div class="sidebar">
                <p class="type-label-md" style="color: #aaa">
                    Shameless copy of the Extreme Demon Roulette by 
                    <a href="https://matcool.github.io/extreme-demon-roulette/" target="_blank">matcool</a>.
                </p>
                <form class="options">
                    <div class="check">
                        <input type="checkbox" id="demonlist" v-model="useDemonList">
                        <label for="demonlist">Demon List</label>
                    </div>
                    <div class="check">
                        <input type="checkbox" id="challengelist" v-model="useChallengeList">
                        <label for="challengelist">Challenge List</label>
                    </div>
                    <Btn @click.native.prevent="onStart">{{ levels.length === 0 ? 'Start' : 'Restart'}}</Btn>
                </form>
                <p class="type-label-md" style="color: #aaa">The roulette saves automatically.</p>
            </div>

            <section class="levels-container">
                <div class="levels">
                    <template v-if="levels.length > 0">
                        <div class="level" v-for="(level, i) in levels.slice(0, progression.length)">
                            <a :href="level.video" class="video">
                                <img :src="getThumbnailFromId(getYoutubeIdFromUrl(level.video))" alt="">
                            </a>
                            <div class="meta">
                                <p>#{{ level.rank }} ({{ level.listType }} List)</p>
                                <h2>{{ level.name }}</h2>
                                <p style="color: #00b54b; font-weight: 700">{{ progression[i] }}%</p>
                            </div>
                        </div>

                        <div class="level" v-if="!hasCompleted">
                            <a :href="currentLevel.video" target="_blank" class="video">
                                <img :src="getThumbnailFromId(getYoutubeIdFromUrl(currentLevel.video))" alt="">
                            </a>
                            <div class="meta">
                                <p>#{{ currentLevel.rank }} ({{ currentLevel.listType }} List)</p>
                                <h2>{{ currentLevel.name }}</h2>
                                <p>{{ currentLevel.id }}</p>
                            </div>
                            <form class="actions" v-if="!givenUp">
                                <input type="number" v-model="percentage" :placeholder="placeholder" :min="currentPercentage + 1" max="100">
                                <Btn @click.native.prevent="onDone">Done</Btn>
                                <Btn @click.native.prevent="onGiveUp" style="background-color: #e91e63;">Give Up</Btn>
                            </form>
                        </div>

                        <div v-if="givenUp || hasCompleted" class="results">
                            <h1>Results</h1>
                            <p>Number of levels: {{ progression.length }}</p>
                            <p>Highest percent: {{ currentPercentage }}%</p>
                            <Btn v-if="currentPercentage < 99 && !hasCompleted" @click.native.prevent="showRemaining = true">Show remaining levels</Btn>
                        </div>

                        <template v-if="givenUp && showRemaining">
                            <div class="level" v-for="(level, i) in levels.slice(progression.length + 1, levels.length - currentPercentage + progression.length)">
                                <a :href="level.video" target="_blank" class="video">
                                    <img :src="getThumbnailFromId(getYoutubeIdFromUrl(level.video))" alt="">
                                </a>
                                <div class="meta">
                                    <p>#{{ level.rank }} ({{ level.listType }} List)</p>
                                    <h2>{{ level.name }}</h2>
                                    <p style="color: #d50000; font-weight: 700">{{ currentPercentage + 2 + i }}%</p>
                                </div>
                            </div>
                        </template>
                    </template>
                </div>
            </section>

            <div class="toasts-container">
                <div class="toasts">
                    <div v-for="toast in toasts" class="toast"><p>{{ toast }}</p></div>
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
        useChallengeList: false,
        toasts: [],
        fileInput: undefined,
    }),
    mounted() {
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.multiple = false;
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
        hasCompleted() { return this.progression.length === this.levels.length; },
        isActive() { return this.progression.length > 0 && !this.givenUp && !this.hasCompleted; },
    },
    methods: {
        shuffle, getThumbnailFromId, getYoutubeIdFromUrl,
        async onStart() {
            if (this.isActive) return this.showToast('Give up before starting a new roulette.');
            if (!this.useDemonList && !this.useChallengeList) return;

            this.loading = true;
            let combinedList = [];

            // Demon List
            if (this.useDemonList) {
                const demonList = await fetchList();
                if (demonList) {
                    demonList.forEach(([lvl], index) => {
                        combinedList.push({
                            rank: index + 1,
                            listType: 'Demon',
                            id: lvl.id,
                            name: lvl.name,
                            video: lvl.verification,
                            records: lvl.records || []
                        });
                    });
                }
            }

            // Challenge List
            if (this.useChallengeList) {
                const challengeList = await fetchChallengeList();
                if (challengeList) {
                    challengeList.forEach(([lvl], index) => {
                        combinedList.push({
                            rank: index + 1,
                            listType: 'Challenge',
                            id: lvl.id,
                            name: lvl.name,
                            video: lvl.verification,
                            records: lvl.records || []
                        });
                    });
                }
            }

            this.levels = shuffle(combinedList).slice(0, 100);
            this.progression = [];
            this.percentage = undefined;
            this.givenUp = false;
            this.showRemaining = false;
            this.loading = false;
            this.save();
        },
        onDone() {
            if (!this.percentage || this.percentage <= this.currentPercentage || this.percentage > 100) return this.showToast('Invalid percentage.');
            this.progression.push(this.percentage);
            this.percentage = undefined;
            this.save();
        },
        onGiveUp() {
            this.givenUp = true;
            localStorage.removeItem('roulette');
        },
        save() {
            localStorage.setItem('roulette', JSON.stringify({
                levels: this.levels,
                progression: this.progression,
            }));
        },
        showToast(msg) {
            this.toasts.push(msg);
            setTimeout(() => this.toasts.shift(), 3000);
        },
        onImport() {
            if (this.isActive && !window.confirm('This will overwrite the current roulette. Continue?')) return;
            this.fileInput.showPicker();
        },
        async onImportUpload() {
            if (!this.fileInput.files.length) return;
            const file = this.fileInput.files[0];
            if (file.type !== 'application/json') return this.showToast('Invalid file.');
            try {
                const data = JSON.parse(await file.text());
                if (!data.levels || !data.progression) return this.showToast('Invalid file.');
                this.levels = data.levels;
                this.progression = data.progression;
                this.save();
                this.givenUp = false;
                this.showRemaining = false;
                this.percentage = undefined;
            } catch {
                this.showToast('Invalid file.');
            }
        }
    }
};
