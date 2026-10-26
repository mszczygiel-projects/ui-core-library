/**
 * An ESLint rule against text written into a component. Text that a component renders on its own
 * comes from a prop or from the labels of `configureUiCore`, so that an application translates
 * it. Both implementations render JSX, so the rule reads text between tags and the values of the
 * attributes that people read or hear, such as `aria-label`, `title` and `placeholder`.
 */
import type { Rule } from 'eslint';

/** Attributes whose values people read or hear. */
const TEXT_ATTRIBUTES = new Set([
  'alt',
  'aria-description',
  'aria-label',
  'aria-placeholder',
  'aria-roledescription',
  'aria-valuetext',
  'label',
  'placeholder',
  'title',
]);

/** Text that a person would read: a letter in any script. Symbols such as a separator pass. */
const READABLE = /\p{L}/u;

interface Located {
  readonly type: string;
  readonly range?: [number, number];
  readonly loc?: Rule.Node['loc'];
}

interface Expression extends Located {
  readonly value?: unknown;
  readonly quasis?: readonly { readonly value: { readonly cooked: string | null } }[];
  readonly expressions?: readonly unknown[];
}

interface JsxAttribute extends Located {
  readonly name: { readonly type: string; readonly name?: unknown };
  readonly value: (Located & { readonly value?: unknown; readonly expression?: Expression }) | null;
}

interface Problem {
  readonly node: Located;
  readonly text: string;
}

/** The text of a string literal or of a template literal without placeholders. */
function literalString(node: Expression | undefined): string | undefined {
  if (node?.type === 'Literal' && typeof node.value === 'string') {
    return node.value;
  }
  if (node?.type === 'TemplateLiteral' && node.expressions?.length === 0) {
    return node.quasis?.[0]?.value.cooked ?? undefined;
  }
  return undefined;
}

/** A string literal, or a template literal without placeholders, that a person would read. */
export function isLiteralText(node: Expression | undefined): boolean {
  return READABLE.test(literalString(node) ?? '');
}

function jsxAttributeName(attribute: JsxAttribute): string {
  return typeof attribute.name.name === 'string' ? attribute.name.name.toLowerCase() : '';
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow text written into a component; take it from a prop or the labels.',
      url: 'https://github.com/mszczygiel-projects/ui-core-library/blob/main/docs/decisions/06-component-api.md',
    },
    schema: [],
    messages: {
      literal:
        'Text "{{text}}" is written into the component: take it from a prop or from the labels of configureUiCore.',
    },
  },
  create(context) {
    const report = (problem: Problem) => {
      context.report({
        node: problem.node,
        messageId: 'literal',
        data: { text: problem.text.length > 40 ? `${problem.text.slice(0, 40)}…` : problem.text },
      });
    };
    return {
      JSXText(node: Located) {
        const value = (node as Located & { readonly value: string }).value;
        if (READABLE.test(value)) {
          report({ node, text: value.trim() });
        }
      },
      JSXAttribute(node: Located) {
        const attribute = node as JsxAttribute;
        if (!TEXT_ATTRIBUTES.has(jsxAttributeName(attribute)) || attribute.value === null) {
          return;
        }
        const { value } = attribute;
        if (
          value.type === 'Literal' &&
          typeof value.value === 'string' &&
          READABLE.test(value.value)
        ) {
          report({ node: value, text: value.value });
        } else if (value.type === 'JSXExpressionContainer' && isLiteralText(value.expression)) {
          report({ node: value, text: literalString(value.expression) ?? '' });
        }
      },
      'JSXElement > JSXExpressionContainer, JSXFragment > JSXExpressionContainer'(node: Located) {
        const { expression } = node as Located & { readonly expression?: Expression };
        if (isLiteralText(expression)) {
          report({ node, text: literalString(expression) ?? '' });
        }
      },
    };
  },
};

export default rule;
