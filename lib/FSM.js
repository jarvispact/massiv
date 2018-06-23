const FSM = class {
    constructor({ initialState, transitions } = {}) {
        if (!initialState) throw new Error('missing argument: "initialState"');
        if (!transitions) throw new Error('missing argument: "transitions"');
        this.initialState = initialState;
        this.transitions = transitions;
        this.state = initialState;
        this.buildTransitions();
    }

    static fromObjectToString(object = {}) {
        const entries = Object.entries(object);
        const stringPairs = entries.map(([key, value]) => `${key}:${value}`);
        return stringPairs.join('|');
    }

    static fromStringToObject(string = '') {
        const keyValuePairs = string.split('|');
        return keyValuePairs.reduce((acc, keyValuePair) => {
            const [key, value] = keyValuePair.split(':');
            acc[key] = value;
            return acc;
        }, {});
    }

    buildTransitions() {
        const { state, transitions } = this;
        const stateObject = FSM.fromStringToObject(state);
        const transitionEntries = Object.entries(transitions);

        transitionEntries.forEach(([transitionName, { from, to }]) => {
            this[transitionName] = () => {
                const fromEntries = Object.entries(from);
                /* eslint-disable no-restricted-syntax */
                for (const [subState, fromStates] of fromEntries) {
                    if (!fromStates.includes(stateObject[subState])) {
                        const error = new Error(`invalid transition: "${transitionName}" in state: "${JSON.stringify(stateObject)}"`);
                        return { error, state: this.state, stateObject };
                    }
                }

                for (const [subState] of fromEntries) {
                    stateObject[subState] = to[subState] || stateObject[subState];
                }
                /* eslint-enable no-restricted-syntax */

                this.state = FSM.fromObjectToString(stateObject);
                return { error: null, state: this.state, stateObject };
            };
        });
    }
};

module.exports = FSM;
