
function tests(suts, harness) {
    const describe = harness.describe;
    const it = harness.it;
    const expect = harness.expect;
    const jest = harness.jest;

    describe("The Test Harness", function () {

        it("should provide 'describe', 'it', 'expect' and 'jest'", function () {
            expect(typeof describe).toBe("function");
            expect(typeof it).toBe("function");
            expect(typeof expect).toBe("function");
            expect(jest).toBeDefined();
        });

    });

}