import { Namespace } from "../src";

describe('[Asynchronizer](https://badcafe.github.io/asynchronizer)', () => {
    describe('Unordered @Namespace()', () => {

        /**
         * ```typescript
         * @Namespace('Section')
         * class DTH {
         *     update(
         *         label: string,
         *         @Type(Section.$) section: Section
         *     )
         * }
         * ```
         */
        test('with @Type() = on-the-fly classes', () => {
            // @Namespace('Section') is applied after creating the inner classes
            // therefore the sequence is :
            class DTH {}
            expect(Namespace.getQualifiedName(DTH)).toBe('DTH');
            class update {}
            expect(Namespace.getQualifiedName(update)).toBe('update');
            Namespace(DTH)(update)
            expect(Namespace.getQualifiedName(update)).toBe('DTH.update');
            expect(Namespace.hasClass('DTH.update')).toBe(update);
            class _1 {}
            expect(Namespace.getQualifiedName(_1)).toBe('_1');
            Namespace(update)(_1)
            expect(Namespace.getQualifiedName(_1)).toBe('DTH.update._1');
            expect(Namespace.hasClass('DTH.update._1')).toBe(_1);
            // here is it :
            Namespace('Section')(DTH)
            expect(Namespace.getQualifiedName(DTH)).toBe('Section.DTH');
            expect(Namespace.hasClass('Section.DTH')).toBe(DTH);
            expect(Namespace.getQualifiedName(update)).toBe('Section.DTH.update');
            // fail before v8.0.0 fix :
            expect(Namespace.hasClass('Section.DTH.update')).toBe(update);
            expect(Namespace.getQualifiedName(_1)).toBe('Section.DTH.update._1');
            expect(Namespace.hasClass('Section.DTH.update._1')).toBe(_1);
            // above, Namespace.getQualifiedName() always work,
            // but Namespace.hasClass() failed before v8.0.0
        });

    });
});
