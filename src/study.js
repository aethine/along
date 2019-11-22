function createStudyEngine(set, cfg) {
    const filter = createFilter(set, cfg)
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
    }
    else {
        engine.complete = engine.complete.concat(engine.active)
        engine.active = []
        for (let i = 0; i < 5; i++) {
            const el = engine.terms.splice(Math.floor(Math.random() * engine.terms.length))
            engine.terms.push(el)
        }
        iter = 0
    }
    return engine
}
function parseFilter(cfg) {
    let words = []
    let current = ''
    let quote = false
    const push = () => {
        if (current != '') {
            words.push({
                word: current,
                str: quote
            })
            current = ''
        }
    }
    for (const char of cfg) {
        if (/\s/.test(char) && !quote) push()
        else if (char == '\'') {
            if (quote) {
                if (current.slice(-1) == '\\')
                    current = current.slice(0, -1) + char
                else {
                    push()
                    quote = false
                }
            }
            else {
                push()
                quote = true
            }
        }
        else current += char
    }
    push()
    return words
}
function transformFilter(parsed) { //todo
    let list = []
    let current = []

    const lastKey = () => {
        if (current[current.length - 1].str) return current[current.length - 1].word
        else return current[current.length - 2].word
    }
    for (const p of parsed) {
        if (p.str) {
            if (current.length > 0 && !current[current.length - 1].str) {
                current.push(p)
            }
            else return `Unexpected string '${p.word}'`
        }
        else {

        }
    }

}
function createFilter(set, cfg) { //todo
    let parsed = parseFilter(cfg)
    let filter = transformFilter(parsed)
    if (filter instanceof String) return filter
    return term => term
}

module.exports = {
    parse: parseFilter
}