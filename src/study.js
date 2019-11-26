const Set = require('./set.js')

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
                if (p.word != 'and' && sGenerators.includes(lastKey())) pushCurrent()
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
    let from, currentFrom, wth, generators, lastKey, isAnd, expectString
    const setValues = () => {
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
    const pushFrom = () => {
        if (currentFrom.length > 0)
            from.push(currentFrom)
    }
    for (const line of list) {
        setValues()
        for (const el of line) {
            if (expectString) {
                switch (lastKey) {
                    case 'from':
                        if (isAnd) {
                            currentFrom.push(el.word)
                            isAnd = false
                        }
                        else {
                            pushFrom()
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
                    if (lastKey == 'and') isAnd = false
                    lastKey = el.word
                }
            }
        }
        pushFrom()
        objects.push({
            from,
            with: wth[0].select != '' ? wth : [],
            generators
        })
    }
    return objects
}
function createFilter(set, cfg) { //todo
    const parsed = parseFilter(cfg)
    const filter = transformFilter(parsed)
    if (filter instanceof String) return filter
    const objects = createFilterObjects(filter)
    if (objects instanceof String) return objects
    return term => {
        const testFrom = (fromList, termCats) => {
            let result
            for (const sub of fromList) {
                result = true
                for (const single of sub) {
                    if (!termCats.includes(single)) result = false
                }
                if (result) return true
            }
            return false
        }
        const testWith = (wth, termWiths) => {
            return termWiths.includes(wth.select)
        }
        const genWith = (wth, term) => {
            let chosen = []
            for (const choose of wth.choose) {
                chosen.push(Set.findProperty(choose, term))
            }
            return chosen
        }
        const generate = (generator, term) => {
            switch (generator) {
                case 'body': return {
                    content: term.content,
                    term
                }
                case 'category': return {
                    content: term.categories[0], //TODO
                    term
                }
            }
        }

        const st = set
        const objs = objects
        let generated = []

        for (const obj in objs) {
            for (const term in set.terms) {
                if (testFrom(obj.from, term.categories) && testWith(obj.with, term.templates)) {
                    for (const wth of obj.with) {
                        generated.concat(
                            genWith(wth, term)
                                .map(a => { content: a, term })
                        )
                    }
                    for (const gen of obj.generators) {
                        generated.push(generate(gen, term))
                    }
                }
            }
        }
        return generated
    }
}

module.exports = {
    parse: parseFilter,
    objects: (cfg) => createFilterObjects(transformFilter(parseFilter(cfg)))
}