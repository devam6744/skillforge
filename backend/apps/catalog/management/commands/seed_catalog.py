from django.core.management.base import BaseCommand
from apps.catalog.models import ProgrammingLanguage, Topic


CATALOG_DATA = [
    {
        "name": "Python",
        "slug": "python",
        "sort_order": 1,
        "topics": [
            {
                "name": "Variables, Types & Flow Control",
                "slug": "variables-control-flow",
                "description": "Fundamental data types, conditionals, loops, and basic type conversion.",
                "sort_order": 1,
            },
            {
                "name": "Functions, Arguments & Scope",
                "slug": "functions-scope",
                "description": "Defining functions, default arguments, *args/**kwargs, and variable scope.",
                "sort_order": 2,
            },
            {
                "name": "Lists, Dicts & Comprehensions",
                "slug": "lists-dicts-comprehensions",
                "description": "Slicing, dictionary lookups, list comprehensions, and data transformations.",
                "sort_order": 3,
            },
            {
                "name": "Classes & Object-Oriented Design",
                "slug": "oop-classes",
                "description": "Classes, methods, inheritance, and special methods (__init__, __str__).",
                "sort_order": 4,
            },
            {
                "name": "Error & Exception Handling",
                "slug": "error-handling",
                "description": "Safe code execution with try, except, finally, and raising descriptive errors.",
                "sort_order": 5,
            },
            {
                "name": "File I/O & Built-in Modules",
                "slug": "file-io-modules",
                "description": "Context managers (with statement), reading/writing files, and json parsing.",
                "sort_order": 6,
            },
        ],
    },
    {
        "name": "JavaScript",
        "slug": "javascript",
        "sort_order": 2,
        "topics": [
            {
                "name": "Variables, Primitives & Operators",
                "slug": "variables-operators",
                "description": "let/const declarations, truthy/falsy values, template literals, and strict equality.",
                "sort_order": 1,
            },
            {
                "name": "Functions, Arrow Syntax & Closures",
                "slug": "functions-scope",
                "description": "First-class functions, lexical scope, arrow functions, and practical closures.",
                "sort_order": 2,
            },
            {
                "name": "Arrays, Objects & Destructuring",
                "slug": "arrays-objects",
                "description": "Object manipulation, array methods (map, filter, reduce), rest/spread syntax.",
                "sort_order": 3,
            },
            {
                "name": "Async Programming & Promises",
                "slug": "async-promises",
                "description": "Handling asynchronous logic, Promises, async/await, and error catching.",
                "sort_order": 4,
            },
            {
                "name": "ES6 Classes & Prototypes",
                "slug": "es6-classes",
                "description": "Class declarations, constructors, methods, inheritance, and static members.",
                "sort_order": 5,
            },
            {
                "name": "DOM Events & Practical Interactivity",
                "slug": "dom-events",
                "description": "Event listeners, event bubbling, form handling, and dynamic element updates.",
                "sort_order": 6,
            },
        ],
    },
    {
        "name": "C++",
        "slug": "cpp",
        "sort_order": 3,
        "topics": [
            {
                "name": "Syntax, Variables & Control Flow",
                "slug": "syntax-basics",
                "description": "Basic syntax, primitive types, conditional branching, and standard loops.",
                "sort_order": 1,
            },
            {
                "name": "Functions & Pass-by-Reference",
                "slug": "functions-references",
                "description": "Pass-by-value vs pass-by-reference, const parameters, and function overloading.",
                "sort_order": 2,
            },
            {
                "name": "Classes & Object-Oriented C++",
                "slug": "classes-objects",
                "description": "Encapsulation, constructors, destructors, access specifiers, and member methods.",
                "sort_order": 3,
            },
            {
                "name": "Pointers & Dynamic Memory (RAII)",
                "slug": "pointers-memory",
                "description": "Address-of, dereferencing, dynamic allocation, and smart pointers (unique_ptr).",
                "sort_order": 4,
            },
            {
                "name": "STL Containers & Algorithms",
                "slug": "stl-basics",
                "description": "Working with std::vector, std::string, std::map, and basic iterators.",
                "sort_order": 5,
            },
            {
                "name": "Inheritance & Polymorphism",
                "slug": "inheritance-polymorphism",
                "description": "Base/derived classes, virtual functions, and runtime polymorphic dispatch.",
                "sort_order": 6,
            },
        ],
    },
    {
        "name": "Java",
        "slug": "java",
        "sort_order": 4,
        "topics": [
            {
                "name": "Syntax, Primitives & Branching",
                "slug": "basics-data-types",
                "description": "Primitive types, arithmetic operators, if-else logic, and loops.",
                "sort_order": 1,
            },
            {
                "name": "Methods & Array Handling",
                "slug": "methods-arrays",
                "description": "Writing methods, parameter passing, return types, and 1D/2D array operations.",
                "sort_order": 2,
            },
            {
                "name": "Classes, Objects & Encapsulation",
                "slug": "oop-fundamentals",
                "description": "Constructors, private fields, getters/setters, and the 'this' keyword.",
                "sort_order": 3,
            },
            {
                "name": "Inheritance & Interfaces",
                "slug": "inheritance-interfaces",
                "description": "Class hierarchies with extends, implementing interfaces, and abstract classes.",
                "sort_order": 4,
            },
            {
                "name": "Collections Framework",
                "slug": "collections-framework",
                "description": "Using ArrayList, HashMap, and HashSet for practical data management.",
                "sort_order": 5,
            },
            {
                "name": "Exceptions & Robustness",
                "slug": "exception-handling",
                "description": "try-catch-finally blocks, throwing checked/unchecked exceptions, custom errors.",
                "sort_order": 6,
            },
        ],
    },
    {
        "name": "C",
        "slug": "c",
        "sort_order": 5,
        "topics": [
            {
                "name": "Data Types, Operators & Flow Control",
                "slug": "syntax-data-types",
                "description": "int, float, char types, standard arithmetic/logical operators, and control loops.",
                "sort_order": 1,
            },
            {
                "name": "Functions & Variable Scope",
                "slug": "loops-functions",
                "description": "Function prototypes, local vs global variables, and modular function design.",
                "sort_order": 2,
            },
            {
                "name": "Pointers & Memory Addresses",
                "slug": "pointers-addresses",
                "description": "Address-of operator (&), pointer dereferencing (*), and pointers as arguments.",
                "sort_order": 3,
            },
            {
                "name": "Arrays & Null-Terminated Strings",
                "slug": "arrays-strings",
                "description": "Fixed arrays, char buffers, null termination ('\\0'), and safe string handling.",
                "sort_order": 4,
            },
            {
                "name": "Structs & Custom Data Types",
                "slug": "structs-typedef",
                "description": "Defining structs, typedef alias, nested structs, and pointer-to-struct (->).",
                "sort_order": 5,
            },
            {
                "name": "Dynamic Memory (malloc/free)",
                "slug": "dynamic-allocation",
                "description": "Heap allocation with malloc, checking for NULL, and freeing allocated memory.",
                "sort_order": 6,
            },
        ],
    },
]


class Command(BaseCommand):
    help = "Seeds fundamental programming language topics for SkillForge catalog (Foundations & Practical Practice)"

    def handle(self, *args, **options):
        self.stdout.write("Syncing SkillForge catalog with core language foundations...")
        # Mark obsolete DSA topics inactive
        Topic.objects.all().update(is_active=False)

        created_languages = 0
        synced_topics = 0

        for lang_info in CATALOG_DATA:
            language, lang_created = ProgrammingLanguage.objects.get_or_create(
                slug=lang_info["slug"],
                defaults={
                    "name": lang_info["name"],
                    "sort_order": lang_info["sort_order"],
                    "is_active": True,
                }
            )
            language.name = lang_info["name"]
            language.sort_order = lang_info["sort_order"]
            language.is_active = True
            language.save()

            if lang_created:
                created_languages += 1
            self.stdout.write(f"  Track: {language.name}")

            for topic_info in lang_info["topics"]:
                topic, _ = Topic.objects.update_or_create(
                    language=language,
                    slug=topic_info["slug"],
                    defaults={
                        "name": topic_info["name"],
                        "description": topic_info["description"],
                        "sort_order": topic_info["sort_order"],
                        "is_active": True,
                    }
                )
                synced_topics += 1
                self.stdout.write(f"    • {topic.name}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully synced {len(CATALOG_DATA)} tracks and {synced_topics} foundation topics!"
            )
        )
