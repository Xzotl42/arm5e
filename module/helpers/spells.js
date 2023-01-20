export function spellTechniqueLabel(item) {
  let label = CONFIG.ARM5E.magic.techniques[item.technique.value].label;
  let techReq = Object.entries(item["technique-req"]).filter(r => r[1] === true);
  if (techReq.length > 0) {
    label += " (";
    techReq.forEach(key => {
      label += CONFIG.ARM5E.magic.arts[key[0]].short + " ";
    });
    // remove last whitespace
    label = label.substring(0, label.length - 1);
    label += ")";
  }

  return label;
}

export function spellFormLabel(item) {
  let label = CONFIG.ARM5E.magic.forms[item.form.value].label;
  let techReq = Object.entries(item["form-req"]).filter(r => r[1] === true);
  if (techReq.length > 0) {
    label += " (";
    techReq.forEach(key => {
      label += CONFIG.ARM5E.magic.arts[key[0]].short + " ";
    });
    // remove last whitespace
    label = label.substring(0, label.length - 1);
    label += ")";
  }

  return label;
}
