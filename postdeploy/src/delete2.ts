import produce from "immer"

interface State {
    readonly x: number
}

// `x` cannot be modified here
const state: State = {
    x: 0
}

const newState = produce(state, draft => {
    // `x` can be modified here
    draft.x++
})

// `newState.x` cannot be modified here

console.log(newState.x);
