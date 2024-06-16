const fields = foundry.data.fields;

export class CovenantSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {};
  }

  static migrateData(data) {
    super.migrateData(data);
    return data;
  }

  static migrate(data) {
    return {};
  }
}
