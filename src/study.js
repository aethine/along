const nGenerators = ['body', 'category'] //generators that dont expect a string
const sGenerators = ['choose'] //generators that expect a string
const nSelectors = ['and'] //selectors that dont expect a string
const sSelectors = ['from', 'with'] //selectors that expect a string
const generators = nGenerators.concat(sGenerators)
const selectors = nSelectors.concat(sSelectors)
const keys = generators.concat(selectors)

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
function transformFilter(parsed) {
    const lastKey = () => {
        if (current.length == 0) return false
        if (!current[current.length - 1].str) return current[current.length - 1].word
        else return current[current.length - 2].word
    }
    const pushCurrent = () => {
        list.push(current)
        current = []
    }
    const tryNewLine = () => {
        if (generators.includes(lastKey())) pushCurrent()
    }

    let list = []
    let current = []
    let expectString = false

    for (const p of parsed) {
        if (p.str) {
            if (expectString) {
                current.push(p)
                expectString = false
            }
            else return `Unexpected string '${p.word}'`
        }
        else {
            if (expectString) return `Expected string after ${current[current.length - 1].word}`
            if (!keys.includes(p.word)) return `Unknown keyword ${p.word}`

            if (nGenerators.includes(p.word)) tryNewLine()
            else {
                if (sGenerators.includes(lastKey())) pushCurrent()
                else if (!nSelectors.includes(p.word)) {
                    tryNewLine()
                    expectString = true
                }
            }
            current.push(p)
        }
    }
    if (expectString) return 'Expected a string at end of statement'
    pushCurrent()
    return list
}
function createFilterObjects(list) {
    let objects = []
    // from: [['a', 'b'], ['c'], ['d']], //a and b c d
    // with: [{
    //     select: 'x',
    //     choose: ['y']
    // }],
    // generators: ['body', 'category']
    let from = []
    let currentFrom = []
    let wth = [{
        select: '',
        choose: []
    }]
    let generators = []
    let lastKey = ''
    let isAnd = false
    let expectString = false
    for (const line of list) {
        for (const el of line) {
            if (expectString) {
                switch (lastKey) {
                    case 'from':
                        if (isAnd) {
                            currentFrom.push(el.word)
                            isAnd = false
                        }
                        else {
                            if (currentFrom.length > 0)
                                from.push(currentFrom)
                            currentFrom = [el.word]
                        }
                        break
                    case 'with':
                        if (wth[wth.length - 1].select != '') {
                            wth.push({ select: '', choose: [] })
                        }
                        wth[wth.length - 1].select = el.word
                        break
                    case 'choose':
                        if (wth[wth.length - 1].select == '') return 'The \'choose\' keyword requires a \'with\' keyword'
                        else wth[wth.length - 1].choose.push(el.word)
                        break
                }
                expectString = false
            }
            else {
                if (nGenerators.includes(el.word))
                    generators.push(el.word)
                if (sGenerators.concat(sSelectors).includes(el.word))
                    expectString = true
                if (el.word == 'and')
                    isAnd = true
                else {
                    lastKey = el.word
                    isAnd = false
                }

            }
        }
        objects.push({
            from,
            with: wth,
            generators
        })
        from = []
        currentFrom = []
        wth = [{
            select: '',
            choose: []
        }]
        generators = []
        lastKey = ''
        isAnd = false
        expectString = false

    }

    return objects
}
function createFilter(set, cfg) { //todo
    let parsed = parseFilter(cfg)
    let filter = transformFilter(parsed)
    if (filter instanceof String) return filter
    let objects = createFilterObjects(filter)
    if (objects instanceof String) return objects
    return term => term
}

module.exports = {
    parse: parseFilter,
    objects: (cfg) => createFilterObjects(transformFilter(parseFilter(cfg)))
}