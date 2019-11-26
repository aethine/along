function readSet(path) {
    return {
        name: `${path}`,
        categories: {
            cata: {
                catc: {
                    _usedby: ['term2'],
                    _parent: 'cata'
                },
                _usedby: ['term1', 'term2']
            },
            catb: {
                _usedby: []
            }
        },
        templates: {
            temp1: {
                prop1: '',
                prop2: {
                    prop3: ''
                }
            }
        },
        terms: {
            term1: {
                content: 'This is Term 1',
                categories: ['cata'],
                templates: [],
                properties: []
            },
            term2: {
                content: 'This is term 2',
                categories: ['cata', 'catc'],
                templates: [],
                properties: []
            }
        }
    }
}
function parseSetPath(set, path) {
    let p = path
    if (path.startsWith('/')) p = p.substr(1)

    const paths = p.split('/')
    if (!set.categories.keys().includes(paths[0]))
        return `Could not find the category "${paths[0]}"`
    switch (paths.length) {
        case 1:
            return [paths[0]]
        case 2:
            if (!set.categories.keys().includes(paths[1]))
                return `Could not find the category "${paths[1]}"`
            return [paths[0], paths[1]]
        default: return 'Unexpected extra /(s)'
    }
}
function findCategory(set, name) {
    const search = (cat) => {
        for (const key in cat) {
            if (key == name) return cat[key]
            else {
                const sub = search(cat[key])
                if (sub) return sub
            }
        }
    }
    for (const key in set.categories) {
        if (key == name) return set.categories[key]
        else {
            const sub = search(cat[key])
            if (sub) return sub
        }
    }
}



function formatCategory(category, prefix) {
    let result = ''
    for (const key in category) {
        if (!key.startsWith('_')) {
            let sub = formatCategory(category[key], prefix + '|    ')
            if (sub == '')
                result += `${prefix}| ${key}\n    `
            else
                result += `${prefix}| ${key}\n    ${sub}\n   `
        }
    }
    return result
}
function formatTerm(term) {
    return `[${term.categories.join(', ')}]: "${term.content}" `
}
function formatSet(set) {
    let categories = ''
    for (const cat in set.categories) {
        categories += `| ${cat}\n    ${formatCategory(set.categories[cat], '|    ')}`
    }
    let terms = ''
    for (const term in set.terms) {
        terms += `| ${term} ${formatTerm(set.terms[term])}\n    `
    }

    return `
    "${set.name}":
    CATEGORIES
    ${categories}
    TERMS
    ${terms}
    `.trim()
}
function findProperty(property, term) {
    const loop = (obj) => {
        for (const key in obj) {
            if (key == property) return obj[key]
            else if (!(obj[key] instanceof String)) {
                const result = findProperty(obj[key])
                if (result) return result
            }
        }
    }
    for (const prop of term.properties) {
        const result = loop(prop)
        if (result) return result
    }
}

module.exports = {
    read: readSet,
    format: formatSet,

    findProperty,
    findCategory,
    parseSetPath
}