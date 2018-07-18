/**
 * @returns {Array<Array<number>>}
 */
function getSplits() {
    /**
     * @type {Array<Array<number>>}
     */
    var result = []

    // Horizontal results
    for (var i = 1; i < 37; i += 3) {
        result.push([i, i + 1])
        result.push([i + 1, i + 2])
    }

    // Vertical results
    for (var i = 1; i < 34; i++) {
        result.push([i, i + 3])
    }

    return result
}

/**
 * @returns {Array<Array<number>>}
 */
function getStreets() {
    /**
     * @type {Array<Array<number>>}
     */
    var result = []

    for (var i = 1; i < 34; i +=3) {
        result.push([i, i + 1, i + 2])
    }
}

/**
 * @returns {Array<Array<number>>}
 */
function getCorners() {}

/**
 * @returns {Array<Array<number>>}
 */
function getDoubleStreets() {}