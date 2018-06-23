const { FSM } = require('../');

test('it should throw if argument "initialState" is missing', () => {
    const getError = () => new FSM();
    expect(getError).toThrowError('missing argument: "initialState"');
});

test('it should throw if argument "transitions" is missing', () => {
    const getError = () => new FSM({ initialState: 'a:foo|b:bar' });
    expect(getError).toThrowError('missing argument: "transitions"');
});

test('it should generate a state-string from a state-object', () => {
    const stateString = FSM.fromObjectToString({ a: 'foo', b: 'bar' });
    expect(stateString).toEqual('a:foo|b:bar');
});

test('it should be able to handle a undefined', () => {
    const stateString = FSM.fromObjectToString(undefined);
    expect(stateString).toEqual('');
});

test('it should generate a state-object from a state-string', () => {
    const stateString = FSM.fromStringToObject('a:foo|b:bar');
    expect(stateString).toEqual({ a: 'foo', b: 'bar' });
});

test('it should be able to handle a undefined', () => {
    const stateString = FSM.fromStringToObject(undefined);
    expect(stateString).toEqual({ '': undefined });
});

test('it should build the transition functions on instantiation of the FSM', () => {
    const initialState = 'a:one|b:one';
    const transitions = {
        a1: { from: { a: ['two', 'three'], b: ['one', 'two', 'three'] }, to: { a: 'one' } },
        a2: { from: { a: ['one', 'three'], b: ['one', 'two', 'three'] }, to: { a: 'two' } },
        a3: { from: { a: ['one', 'two'], b: ['one', 'two', 'three'] }, to: { a: 'three' } },
        b1: { from: { a: ['one', 'two', 'three'], b: ['two', 'three'] }, to: { b: 'one' } },
        b2: { from: { a: ['one', 'two', 'three'], b: ['one', 'three'] }, to: { b: 'two' } },
        b3: { from: { a: ['one', 'two', 'three'], b: ['one', 'two'] }, to: { b: 'three' } },
    };

    const fsm = new FSM({ initialState, transitions });
    expect(fsm).toHaveProperty('a1');
    expect(fsm).toHaveProperty('a2');
    expect(fsm).toHaveProperty('a3');
    expect(fsm).toHaveProperty('b1');
    expect(fsm).toHaveProperty('b2');
    expect(fsm).toHaveProperty('b3');
});

test('it should return a error and the old state if the transition is invalid', () => {
    const initialState = 'a:one|b:one';
    const transitions = {
        a1: { from: { a: ['two', 'three'], b: ['one', 'two', 'three'] }, to: { a: 'one' } },
    };

    const fsm = new FSM({ initialState, transitions });
    const { error, state, stateObject } = fsm.a1();
    expect(error.message).toEqual('invalid transition: "a1" in state: "{"a":"one","b":"one"}"');
    expect(state).toEqual(initialState);
    expect(stateObject).toEqual(FSM.fromStringToObject(initialState));
});

test('it should return no error and the new state if the transition is valid', () => {
    const initialState = 'a:one|b:one';
    const transitions = {
        a2: { from: { a: ['one', 'three'], b: ['one', 'two', 'three'] }, to: { a: 'two' } },
    };

    const fsm = new FSM({ initialState, transitions });
    const { error, state, stateObject } = fsm.a2();
    expect(error).toBeNull();
    expect(state).toEqual('a:two|b:one');
    expect(stateObject).toEqual({ a: 'two', b: 'one' });
});

test('it should change both subStates if specified in the "to" declaration', () => {
    const initialState = 'a:one|b:one';
    const transitions = {
        a2: { from: { a: ['one', 'three'], b: ['one', 'three'] }, to: { a: 'two', b: 'two' } },
    };

    const fsm = new FSM({ initialState, transitions });
    const { error, state, stateObject } = fsm.a2();
    expect(error).toBeNull();
    expect(state).toEqual('a:two|b:two');
    expect(stateObject).toEqual({ a: 'two', b: 'two' });
});

test('it should return a error if a subState is not satisfied, also if it is not in the "to" declaration', () => {
    const initialState = 'a:one|b:one';
    const transitions = {
        a2: { from: { a: ['one', 'three'], b: ['two', 'three'] }, to: { a: 'two' } },
    };

    const fsm = new FSM({ initialState, transitions });
    const { error, state, stateObject } = fsm.a2();
    expect(error.message).toEqual('invalid transition: "a2" in state: "{"a":"one","b":"one"}"');
    expect(state).toEqual(initialState);
    expect(stateObject).toEqual(FSM.fromStringToObject(initialState));
});

test('it should be able to call multiple transitions on the same fsm instance', () => {
    const initialState = 'a:one|b:one';
    const transitions = {
        a1: { from: { a: ['two', 'three'], b: ['one', 'two', 'three'] }, to: { a: 'one' } },
        a2: { from: { a: ['one', 'three'], b: ['one', 'two', 'three'] }, to: { a: 'two' } },
        b1: { from: { a: ['one', 'two', 'three'], b: ['two', 'three'] }, to: { b: 'one' } },
        b2: { from: { a: ['one', 'two', 'three'], b: ['one', 'three'] }, to: { b: 'two' } },
    };

    const fsm = new FSM({ initialState, transitions });

    const { error: e1, state: s1, stateObject: so1 } = fsm.a2();
    expect(e1).toBeNull();
    expect(s1).toEqual('a:two|b:one');
    expect(so1).toEqual({ a: 'two', b: 'one' });
    expect(fsm.state).toEqual('a:two|b:one');

    const { error: e2, state: s2, stateObject: so2 } = fsm.b2();
    expect(e2).toBeNull();
    expect(s2).toEqual('a:two|b:two');
    expect(so2).toEqual({ a: 'two', b: 'two' });
    expect(fsm.state).toEqual('a:two|b:two');

    const { error: e3, state: s3, stateObject: so3 } = fsm.a1();
    expect(e3).toBeNull();
    expect(s3).toEqual('a:one|b:two');
    expect(so3).toEqual({ a: 'one', b: 'two' });
    expect(fsm.state).toEqual('a:one|b:two');

    const { error: e4, state: s4, stateObject: so4 } = fsm.b1();
    expect(e4).toBeNull();
    expect(s4).toEqual('a:one|b:one');
    expect(so4).toEqual({ a: 'one', b: 'one' });
    expect(fsm.state).toEqual('a:one|b:one');
});
