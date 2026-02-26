/**
 * In-memory storage that mimics Mongoose model API.
 * Persists data to JSON files in server/data/ so it survives restarts.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Debounce timers per collection
const _flushTimers = {};

function _scheduleFlush(collectionName) {
  if (_flushTimers[collectionName]) clearTimeout(_flushTimers[collectionName]);
  _flushTimers[collectionName] = setTimeout(() => {
    _flushToDisk(collectionName);
  }, 100);
}

function _flushToDisk(collectionName) {
  try {
    const store = MemoryStore.stores[collectionName];
    if (!store) return;
    const filePath = path.join(DATA_DIR, `${collectionName}.json`);
    const data = store.map(doc => {
      const obj = { ...doc };
      delete obj._collectionName;
      return obj;
    });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[MemoryStore] Failed to flush ${collectionName}:`, err.message);
  }
}

function _loadFromDisk(collectionName) {
  try {
    const filePath = path.join(DATA_DIR, `${collectionName}.json`);
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return data.map(item => {
      // Restore Date objects
      if (item.createdAt) item.createdAt = new Date(item.createdAt);
      if (item.updatedAt) item.updatedAt = new Date(item.updatedAt);
      return new MemoryDocument(item, collectionName);
    });
  } catch (err) {
    console.error(`[MemoryStore] Failed to load ${collectionName}:`, err.message);
    return [];
  }
}

class MemoryDocument {
  constructor(data, collectionName) {
    this._id = data._id || crypto.randomUUID();
    this._collectionName = collectionName;
    Object.assign(this, data);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
  }

  toObject() {
    const obj = { ...this };
    delete obj._collectionName;
    return obj;
  }

  toJSON() {
    return this.toObject();
  }

  async save() {
    this.updatedAt = new Date();
    const store = MemoryStore.stores[this._collectionName];
    if (store) {
      const idx = store.findIndex(d => d._id === this._id);
      if (idx >= 0) store[idx] = this;
      else store.push(this);
      _scheduleFlush(this._collectionName);
    }
    return this;
  }
}

class MemoryQuery {
  constructor(collectionName, filter = {}) {
    this._collectionName = collectionName;
    this._filter = filter;
    this._sort = null;
    this._skip = 0;
    this._limit = 0;
    this._populate = [];
  }

  sort(s) { this._sort = s; return this; }
  skip(n) { this._skip = n; return this; }
  limit(n) { this._limit = n; return this; }
  populate(field, select) { this._populate.push({ field, select }); return this; }
  select(s) { return this; } // no-op for memory

  _matchFilter(doc, filter) {
    for (const [key, value] of Object.entries(filter)) {
      // Handle $or operator
      if (key === '$or') {
        if (!Array.isArray(value)) return false;
        const anyMatch = value.some(subFilter => this._matchFilter(doc, subFilter));
        if (!anyMatch) return false;
        continue;
      }

      // Handle $and operator
      if (key === '$and') {
        if (!Array.isArray(value)) return false;
        const allMatch = value.every(subFilter => this._matchFilter(doc, subFilter));
        if (!allMatch) return false;
        continue;
      }

      const docVal = this._getNestedValue(doc, key);

      if (value === null) {
        if (docVal !== null && docVal !== undefined) return false;
        continue;
      }

      if (value instanceof RegExp) {
        if (!value.test(String(docVal || ''))) return false;
        continue;
      }

      if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        let matched = true;

        // Handle MongoDB operators
        if ('$ne' in value) {
          if (docVal === value.$ne) matched = false;
        }
        if ('$gte' in value) {
          if (!(docVal >= value.$gte)) matched = false;
        }
        if ('$lte' in value) {
          if (!(docVal <= value.$lte)) matched = false;
        }
        if ('$gt' in value) {
          if (!(docVal > value.$gt)) matched = false;
        }
        if ('$lt' in value) {
          if (!(docVal < value.$lt)) matched = false;
        }
        if ('$all' in value) {
          if (!Array.isArray(docVal)) { matched = false; }
          else if (!value.$all.every(v => docVal.includes(v))) { matched = false; }
        }
        if ('$in' in value) {
          if (!value.$in.some(v => String(docVal) === String(v))) matched = false;
        }
        if ('$nin' in value) {
          if (value.$nin.some(v => String(docVal) === String(v))) matched = false;
        }
        // Handle $regex + $options (MongoDB string matching)
        if ('$regex' in value) {
          const flags = value.$options || '';
          const regex = new RegExp(value.$regex, flags);
          if (!regex.test(String(docVal || ''))) matched = false;
        }
        // Handle $exists
        if ('$exists' in value) {
          const exists = docVal !== undefined && docVal !== null;
          if (value.$exists && !exists) matched = false;
          if (!value.$exists && exists) matched = false;
        }

        if (!matched) return false;
        continue;
      }

      if (String(docVal) !== String(value)) return false;
    }
    return true;
  }

  _getNestedValue(obj, path) {
    return path.split('.').reduce((o, k) => o?.[k], obj);
  }

  _applySort(results) {
    if (!this._sort) return results;
    const sortStr = typeof this._sort === 'string' ? this._sort : '';
    const sortObj = typeof this._sort === 'object' ? this._sort : {};

    if (sortStr) {
      const parts = sortStr.split(' ');
      for (const part of parts) {
        const desc = part.startsWith('-');
        const field = desc ? part.slice(1) : part;
        results.sort((a, b) => {
          const av = a[field], bv = b[field];
          if (av < bv) return desc ? 1 : -1;
          if (av > bv) return desc ? -1 : 1;
          return 0;
        });
      }
    } else {
      for (const [field, dir] of Object.entries(sortObj)) {
        results.sort((a, b) => {
          const av = a[field], bv = b[field];
          if (av < bv) return dir === -1 ? 1 : -1;
          if (av > bv) return dir === -1 ? -1 : 1;
          return 0;
        });
      }
    }
    return results;
  }

  async _resolve() {
    const store = MemoryStore.stores[this._collectionName] || [];
    let results = store.filter(doc => this._matchFilter(doc, this._filter));
    results = this._applySort(results);
    if (this._skip > 0) results = results.slice(this._skip);
    if (this._limit > 0) results = results.slice(0, this._limit);
    return results;
  }

  then(resolve, reject) {
    return this._resolve().then(resolve, reject);
  }

  async exec() {
    return this._resolve();
  }
}

class MemoryModel {
  constructor(name, defaults = {}) {
    this.modelName = name;
    this.defaults = defaults;
    if (!MemoryStore.stores[name]) {
      // Try to load from disk first
      const loaded = _loadFromDisk(name);
      MemoryStore.stores[name] = loaded.length > 0 ? loaded : [];
      if (loaded.length > 0) {
        console.log(`  [MemoryStore] Loaded ${loaded.length} ${name} records from disk`);
      }
    }
  }

  get store() {
    return MemoryStore.stores[this.modelName];
  }

  async create(data) {
    const doc = new MemoryDocument(
      { ...this.defaults, ...data },
      this.modelName,
    );
    this.store.push(doc);
    _scheduleFlush(this.modelName);
    return doc;
  }

  find(filter = {}) {
    return new MemoryQuery(this.modelName, filter);
  }

  findOne(filter = {}) {
    const query = new MemoryQuery(this.modelName, filter);
    const originalResolve = query._resolve.bind(query);
    query._resolve = async () => {
      const results = await originalResolve();
      return results[0] || null;
    };
    query.then = (resolve, reject) => query._resolve().then(resolve, reject);
    return query;
  }

  findById(id) {
    const self = this;
    const chain = {
      _selectFields: null,
      _populateOpts: [],
      select(s) { chain._selectFields = s; return chain; },
      populate(field, select) { chain._populateOpts.push({ field, select }); return chain; },
      then(resolve, reject) {
        const doc = self.store.find(d => String(d._id) === String(id)) || null;
        return Promise.resolve(doc).then(resolve, reject);
      },
      catch(fn) { return chain.then(undefined, fn); },
    };
    return chain;
  }

  findByIdAndUpdate(id, updates, options = {}) {
    const self = this;
    const chain = {
      _selectFields: null,
      select(s) { chain._selectFields = s; return chain; },
      populate() { return chain; },
      then(resolve, reject) {
        try {
          const doc = self.store.find(d => String(d._id) === String(id));
          if (!doc) return Promise.resolve(null).then(resolve, reject);

          if (updates.$inc) {
            for (const [k, v] of Object.entries(updates.$inc)) {
              doc[k] = (doc[k] || 0) + v;
            }
          }
          if (updates.$set) {
            Object.assign(doc, updates.$set);
          }
          const plainUpdates = { ...updates };
          delete plainUpdates.$inc;
          delete plainUpdates.$set;
          Object.assign(doc, plainUpdates);
          doc.updatedAt = new Date();
          _scheduleFlush(self.modelName);
          return Promise.resolve(doc).then(resolve, reject);
        } catch (err) {
          return Promise.reject(err).then(resolve, reject);
        }
      },
      catch(fn) { return chain.then(undefined, fn); },
    };
    return chain;
  }

  async findOneAndUpdate(filter, updates, options = {}) {
    const doc = await this.findOne(filter);
    if (!doc) return null;

    if (updates.$inc) {
      for (const [k, v] of Object.entries(updates.$inc)) {
        doc[k] = (doc[k] || 0) + v;
      }
    }
    if (updates.$set) {
      Object.assign(doc, updates.$set);
    }

    const plainUpdates = { ...updates };
    delete plainUpdates.$inc;
    delete plainUpdates.$set;
    Object.assign(doc, plainUpdates);
    doc.updatedAt = new Date();
    _scheduleFlush(this.modelName);
    return doc;
  }

  async findByIdAndDelete(id) {
    const idx = this.store.findIndex(d => String(d._id) === String(id));
    if (idx < 0) return null;
    const removed = this.store.splice(idx, 1)[0];
    _scheduleFlush(this.modelName);
    return removed;
  }

  async findOneAndDelete(filter) {
    const doc = await this.findOne(filter);
    if (!doc) return null;
    const idx = this.store.findIndex(d => d._id === doc._id);
    if (idx >= 0) this.store.splice(idx, 1);
    _scheduleFlush(this.modelName);
    return doc;
  }

  async countDocuments(filter = {}) {
    const query = new MemoryQuery(this.modelName, filter);
    const results = await query._resolve();
    return results.length;
  }

  async deleteMany(filter = {}) {
    const query = new MemoryQuery(this.modelName, filter);
    const toDelete = await query._resolve();
    for (const doc of toDelete) {
      const idx = this.store.findIndex(d => d._id === doc._id);
      if (idx >= 0) this.store.splice(idx, 1);
    }
    if (toDelete.length > 0) _scheduleFlush(this.modelName);
    return { deletedCount: toDelete.length };
  }

  async updateMany(filter = {}, updates = {}) {
    const query = new MemoryQuery(this.modelName, filter);
    const docs = await query._resolve();
    for (const doc of docs) {
      if (updates.$inc) {
        for (const [k, v] of Object.entries(updates.$inc)) {
          doc[k] = (doc[k] || 0) + v;
        }
      }
      if (updates.$set) {
        Object.assign(doc, updates.$set);
      }
      const plainUpdates = { ...updates };
      delete plainUpdates.$inc;
      delete plainUpdates.$set;
      Object.assign(doc, plainUpdates);
      doc.updatedAt = new Date();
    }
    if (docs.length > 0) _scheduleFlush(this.modelName);
    return { modifiedCount: docs.length, matchedCount: docs.length };
  }
}

class MemoryStore {
  static stores = {};

  static createModel(name, defaults = {}) {
    return new MemoryModel(name, defaults);
  }

  static clear() {
    MemoryStore.stores = {};
  }
}

export { MemoryStore, MemoryModel, MemoryDocument };
