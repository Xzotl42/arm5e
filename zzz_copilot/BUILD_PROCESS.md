# Build Process Recommendations

## Current State

- **File Structure**: Single CSS file (`css/arm5e.css`, ~2,850 lines after optimization)
- **Vendor Prefixes**: Manual management (recently completed - removed outdated prefixes)
- **Minification**: None (development source served directly)
- **Preprocessors**: None (direct CSS authoring)
- **Target Browsers**: Foundry VTT V13 minimum
  - Chrome 100+
  - Firefox 100+
  - Safari 15+

---

## Evaluated Options

### 1. PostCSS with Autoprefixer

**Description**: Automatic vendor prefixing based on browserslist configuration.

**Pros**:
- Automatic vendor prefixing based on target browsers
- Future-proof as browser support evolves
- Industry standard tooling
- Integrates well with other PostCSS plugins

**Cons**:
- Adds build step complexity
- May re-add prefixes we deliberately removed
- Unnecessary overhead for current browser targets
- Requires Node.js toolchain maintenance

**Recommendation**: ❌ **NOT NEEDED**

**Rationale**: Target browsers (Chrome 100+, Firefox 100+, Safari 15+) don't require vendor prefixes for any CSS properties used in this system. Modern CSS features (flexbox, grid, custom properties, transforms) are fully supported unprefixed. Manual vendor prefix removal has already been completed.

---

### 2. CSS Minification

**Description**: Compress CSS for production using tools like cssnano, clean-css, or Lightning CSS.

**Pros**:
- Reduces file size by approximately 30-40%
- Estimated: ~60-70KB unminified → ~40-50KB minified
- Faster load times for users
- Bandwidth savings
- No impact on source code maintainability

**Cons**:
- Requires build step
- Source maps needed for debugging production issues
- Additional npm scripts and tooling

**Recommendation**: ✅ **MODERATE PRIORITY**

**Rationale**: Significant performance benefit with minimal maintenance overhead. Implement for production builds only while keeping source CSS in repository for development.

**Implementation Plan**:
1. Add build tool dependency (recommended: Lightning CSS for speed, or cssnano for comprehensive optimization)
2. Add npm scripts:
   ```json
   {
     "scripts": {
       "build:css": "lightningcss --minify --sourcemap css/arm5e.css -o css/arm5e.min.css",
       "watch:css": "lightningcss --minify --sourcemap --watch css/arm5e.css -o css/arm5e.min.css"
     }
   }
   ```
3. Update `system.json` to reference minified CSS in production
4. Add `css/arm5e.min.css` and `css/arm5e.min.css.map` to `.gitignore`
5. Document build process in README.md

**Suggested Tool**: 
- **Lightning CSS** (preferred): Extremely fast, modern, written in Rust
- **cssnano** (alternative): Comprehensive optimization, well-established

---

### 3. CSS-in-JS Solutions

**Description**: Component-scoped styling using libraries like styled-components or emotion.

**Pros**:
- Component-scoped styles prevent conflicts
- Dynamic styling based on component state
- Type safety with TypeScript
- Co-location of styles with component logic

**Cons**:
- Requires major refactoring of entire codebase
- Runtime overhead (styles injected at runtime)
- Not standard practice in Foundry VTT ecosystem
- Incompatible with Foundry's Handlebars template system
- Adds significant bundle size
- Learning curve for contributors

**Recommendation**: ❌ **NOT RECOMMENDED**

**Rationale**: Foundry VTT systems use traditional CSS + Handlebars templates. CSS-in-JS is designed for React/Vue ecosystems and would be architecturally incompatible with Foundry's rendering system. The overhead and complexity outweigh any benefits for this use case.

---

### 4. CSS Preprocessors (Sass, Less, Stylus)

**Description**: Use a CSS preprocessor for advanced features like variables, nesting, mixins, and functions.

**Pros**:
- Variables and mixins for reusable patterns (though CSS custom properties handle variables)
- Nesting for cleaner syntax
- Mathematical functions and color manipulation
- Partials for splitting large files
- Well-established tooling and community

**Cons**:
- Adds build step and toolchain maintenance
- CSS custom properties (already used extensively) provide native variables
- Modern CSS reduces need for nesting with better cascade layers
- Additional learning curve for contributors
- Compilation overhead during development

**Recommendation**: ⚠️ **LOW PRIORITY**

**Rationale**: Modern CSS features already meet current needs:
- **Variables**: CSS custom properties extensively used (colors, spacing, border-radius, shadows, fonts)
- **Calculations**: CSS `calc()` function available
- **Theming**: CSS custom property-based theming already partially implemented (`--theme-light`)

**Consider Only If**:
- System grows beyond 5,000 lines and needs better file organization
- Complex theme variants requiring color manipulation functions
- Team specifically requests preprocessor features

---

## Immediate Action Items

### Priority 1: Add CSS Minification
- **Timeline**: Next minor version release
- **Effort**: 2-4 hours
- **Tools**: Lightning CSS or cssnano
- **Tasks**:
  1. Add build tool to `package.json` dependencies
  2. Create npm build scripts
  3. Update `system.json` to reference minified CSS
  4. Add build artifacts to `.gitignore`
  5. Document in README.md

### Priority 2: Add Linting
- **Timeline**: Next sprint
- **Effort**: 1-2 hours
- **Tool**: stylelint
- **Configuration**:
  ```json
  {
    "extends": "stylelint-config-standard",
    "rules": {
      "selector-class-pattern": "^[a-z][a-zA-Z0-9-]*$",
      "custom-property-pattern": "^[a-z][a-z0-9-]*$",
      "declaration-no-important": null,
      "no-descending-specificity": null
    }
  }
  ```
- **Benefits**: Enforce consistency, catch errors early, improve code quality

### Priority 3: Document Build Process
- **Timeline**: Immediate
- **Effort**: 30 minutes
- **Add to README.md**:
  - Development workflow
  - Build commands
  - Testing guidelines
  - Contribution guidelines for CSS changes

---

## Future Considerations

### File Organization
**Trigger**: System grows beyond 5,000 lines of CSS

**Approach**: Split into logical modules
```
css/
  ├── base.css           # Variables, resets, typography
  ├── layout.css         # Grid, flexbox utilities
  ├── components.css     # Buttons, inputs, tooltips
  ├── sheets/
  │   ├── character.css
  │   ├── npc.css
  │   ├── covenant.css
  │   └── lab.css
  └── arm5e.css          # Main file importing all modules
```

**Build**: Concatenate during build process

---

### Browser Support Changes
**Monitor**: Foundry VTT version updates and browser requirements

**Action**: Reassess vendor prefix needs if:
- Foundry adds support for older browsers
- New CSS features are adopted that lack broad support

---

### Multi-Theme Support
**Current**: Single theme with some CSS custom property support

**Future**: Full custom property-based theming
- Define complete color palette as custom properties
- Create theme variant files (dark, high-contrast, etc.)
- Allow user theme selection
- Document theme customization for module developers

**Benefits**:
- Accessibility improvements
- User preference support
- Easier theme maintenance
- Community theme contributions

---

## References

- [Lightning CSS](https://lightningcss.dev/) - Fast CSS processor
- [cssnano](https://cssnano.co/) - CSS minification tool
- [stylelint](https://stylelint.io/) - CSS linter
- [Modern CSS Features](https://web.dev/learn/css/) - Web.dev CSS guide
- [Foundry VTT System Development](https://foundryvtt.com/article/system-development/) - Official documentation

---

## Change Log

- **2026-01-10**: Initial build process evaluation and recommendations
  - Completed vendor prefix removal
  - Evaluated PostCSS, minification, CSS-in-JS, and preprocessors
  - Documented immediate action items and future considerations
