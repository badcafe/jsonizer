import { Class, Jsonizer, Namespace } from "../src";
import { Errors } from "../src/base";

describe('Class', () => {
    describe('rename()', () => {

        test('w/o ns', () => {
            class MyClass {}
            const YourClass = Class.rename(MyClass, 'YourClass');
            expect(MyClass.name).toBe('MyClass');
            expect(YourClass.name).toBe('YourClass');
        });

        test('with @Namespace', () => {
            class RootClass {}
            @Namespace(RootClass)
            class ParentClass {}
            @Namespace(ParentClass)
            class ChildClass {}
            expect(Namespace.getQualifiedName(RootClass)).toBe('RootClass');
            expect(Namespace.getQualifiedName(ParentClass)).toBe('RootClass.ParentClass');
            expect(Namespace.getQualifiedName(ChildClass)).toBe('RootClass.ParentClass.ChildClass');
            const ClassParent = Class.rename(ParentClass, 'ClassParent');
            expect(Namespace.getQualifiedName(RootClass)).toBe('RootClass');
            expect(Namespace.getQualifiedName(ClassParent)).toBe('RootClass.ClassParent');
            expect(Namespace.getQualifiedName(ChildClass)).toBe('RootClass.ClassParent.ChildClass');
            expect(Namespace.getQualifiedName(ParentClass)).toBe('ParentClass');
        });

    });

    describe('Inherit', () => {
        test('Parent class is also the namespace', () => {
            class ParentA {}
            @Namespace(ParentA)
            class ChildA extends ParentA {}
            expect(Namespace.getQualifiedName(ChildA)).toBe('ParentA.ChildA');
        })
    });

    describe('Library loaded multiple times', () => {
        const NameConflict = Errors.getClass('Name Conflict', true, 409);

        // this is what happen when the library is loaded multiple times :
        @Namespace(Jsonizer.NAMESPACE)
        class Reviver {} // ...except that the impl is the same as internal.reviver
        const revQName = Namespace.getQualifiedName(Reviver);

        test('Duplicate', () => {
            expect(() => {
                Namespace.hasClass(revQName)
            }).toThrow(NameConflict);
        });

        test('Deduplicate', () => {
            Namespace.dedup(revQName);
            expect(() => {
                Namespace.hasClass(revQName)
            }).not.toThrow(NameConflict);
        });
    })
});
