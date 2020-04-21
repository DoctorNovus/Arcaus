export class DataGenerator {
    static generateID(count) {
        return Math.floor(Math.random() * count);
    }

    /**
     * Returns a random token segment
     */
    static generateRandomText() {
        return Math.random().toString(36).substr(2); // remove `0.`
    };

    /**
     * Returns a full token
     */
    static generateToken() {
        return DataGenerator.generateRandomText() + DataGenerator.generateRandomText(); // to make it longer
    };
}