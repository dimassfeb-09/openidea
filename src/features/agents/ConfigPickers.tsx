/**
 * Model, mode, approvals and thinking-effort dropdowns for a composer's bottom row.
 * Modes and approvals use icons; levels are plain text.
 */
import type { AgentConfigOption } from "@/bindings";
import { useTx } from "@/platform/i18n";
import { Select } from "@/ui";
import { mainOptions, modeIcon } from "./composerModel";
import styles from "./Composer.module.css";

export function ConfigPickers({
  config,
  values,
  onChange,
}: {
  config: readonly AgentConfigOption[];
  /** Chosen values that override `current`, by option id. */
  values?: Record<string, string>;
  onChange: (option: string, value: string) => void;
}) {
  const tx = useTx();
  return (
    <>
      {mainOptions(config).map((o) => {
        const isMode = o.category === "mode";
        const value = values?.[o.id] ?? o.current ?? null;
        const isModel = o.category === "model";

        // For model options, group by provider path so the dropdown stays scannable.
        const options = isModel
          ? (() => {
              const groups = new Map<string, { value: string; label: string; detail?: string; disabled?: boolean }[]>();
              for (const v of o.values) {
                const full = v.value && v.value.includes("/") ? v.value : v.name || v.value;
                const slash = full.lastIndexOf("/");
                const provider = slash >= 0 ? (full.split("/")[0] ?? "") : "";
                const modelName = slash >= 0 ? full.slice(slash + 1) : full;
                // Hide the main provider (already shown as the section header) from
                // the detail, so it reads "cmc/Beam" instead of "9router/cmc/Beam".
                const rest = full.split("/").slice(1).join("/") || full;
                const detail =
                  slash >= 0 ? (v.description ? `${rest} · ${v.description}` : rest) : (v.description ?? undefined);
                const item = { value: v.value, label: modelName, detail, keywords: provider };
                const bucket = groups.get(provider) ?? [];
                bucket.push(item);
                groups.set(provider, bucket);
              }
              const out: { value: string; label: string; detail?: string; disabled?: boolean }[] = [];
              for (const [provider, items] of groups) {
                if (provider) {
                  out.push({ value: `__section__:${provider}`, label: provider, disabled: true });
                }
                out.push(...items);
              }
              return out;
            })()
          : o.values.map((v) => ({
              value: v.value,
              label: v.name,
              detail: v.description ?? undefined,
            }));

        return (
          <Select
            key={o.id}
            variant="ghost"
            aria-label={o.name}
            value={value}
            placeholder={tx(o.name)}
            options={options.map((opt) => ({
              ...opt,
              icon:
                o.category === "approval"
                  ? opt.value === "bypass"
                    ? "unlock"
                    : "lock"
                  : isMode
                    ? modeIcon(opt.value)
                    : undefined,
            }))}
            searchable={o.category === "model"}
            onChange={(v) => onChange(o.id, v)}
            // Effort and other levels say what they are: "Effort  Medium".
            renderValue={
              o.category === "thought_level"
                ? (current) => (
                    <span className={styles.pickerValue}>
                      <span className={styles.pickerName}>{o.name}</span>
                      {current?.label ?? tx("Default")}
                    </span>
                  )
                : undefined
            }
          />
        );
      })}
    </>
  );
}
