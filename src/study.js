const Filter = require('./filter.js')
function createStudyEngine(set, cfg) {
    const filter = Filter.createFilter(set, cfg)
    let terms = []
    for (const key in set.terms) {
        const term = filter(set.terms[key])
        if (term) terms.push(term)
    }
    return {
        set,
        terms,
        active: [],
        complete: [],
        iter: 0
    }
}
function studyEngine(engine, study) {
    if (engine.iter < 5 && active.length > 0) {
        study(engine.active)
        engine.iter = engine.iter + 1
        return engine
    }
    else {
        engine.complete = engine.complete.concat(engine.active)
        engine.active = []
        for (let i = 0; i < 5; i++) {
            const el = engine.terms.splice(Math.floor(Math.random() * engine.terms.length))
            engine.terms.push(el)
        }
        iter = 0
        return studyEngine(engine, study)
    }
}

module.exports = {
    createStudyEngine,
    studyEngine
}