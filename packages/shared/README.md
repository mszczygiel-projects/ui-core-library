# @mszczygiel-projects/ui-core-shared

What the web components and the React components of UI Core Library share: the specification of each component, with its props, allowed values and defaults, and pure functions that are safe for server rendering. Applications rarely import it directly; both component packages depend on it.

Each module has a subpath, such as `./button` or `./one-of`, and none has side effects.
