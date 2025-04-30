# Storage Features Examples

This document provides practical examples of using Lucent's storage features, including multiple backends, migrations, versioning, and encryption.

## Basic Setup

```typescript
import { withStorage, StorageConfig } from "../utils/storageUtils";

// Configure storage
const storageConfig: StorageConfig = {
  backend: "localStorage", // or 'indexedDB'
  version: "1.0.0",
  prefix: "myapp_",
  migrateOnVersionChange: true,
};

// Create store with storage persistence
const useStore = create(
  withStorage(
    (set, get) => ({
      // Your store implementation
    }),
    storageConfig
  )
);
```

## Multiple Storage Backends

### LocalStorage Backend

```typescript
const localStorageConfig: StorageConfig = {
  backend: "localStorage",
  version: "1.0.0",
  prefix: "app_",
};

// Use localStorage for small data
const useLocalStore = create(
  withStorage(
    (set, get) => ({
      // Small state that fits in localStorage
    }),
    localStorageConfig
  )
);
```

### IndexedDB Backend

```typescript
const indexedDBConfig: StorageConfig = {
  backend: "indexedDB",
  version: "1.0.0",
};

// Use IndexedDB for larger data
const useIndexedDBStore = create(
  withStorage(
    (set, get) => ({
      // Larger state that needs IndexedDB
    }),
    indexedDBConfig
  )
);
```

## Storage Migration

### Basic Migration

```typescript
// Define migration from v1.0.0 to v1.1.0
const migration: StorageMigration = {
  fromVersion: "1.0.0",
  toVersion: "1.1.0",
  migrate: (data) => {
    // Transform data from old format to new format
    return {
      ...data,
      newField: "default value",
    };
  },
};

// Add migration to storage manager
const storage = new StorageManager({
  backend: "localStorage",
  version: "1.1.0",
  migrateOnVersionChange: true,
});

storage.addMigration(migration);
```

### Complex Migration

```typescript
// Complex migration example
const complexMigration: StorageMigration = {
  fromVersion: "1.1.0",
  toVersion: "2.0.0",
  migrate: async (data) => {
    // Transform nested data
    const transformedData = {
      ...data,
      items: data.items.map((item) => ({
        ...item,
        // Add new fields
        metadata: {
          createdAt: item.createdAt || Date.now(),
          updatedAt: Date.now(),
        },
        // Transform existing fields
        status: item.active ? "active" : "inactive",
      })),
    };

    // Validate transformed data
    if (!validateData(transformedData)) {
      throw new Error("Migration failed: Invalid data structure");
    }

    return transformedData;
  },
};
```

## Storage Versioning

### Version Management

```typescript
// Configure versioning
const versionedConfig: StorageConfig = {
  backend: "localStorage",
  version: "2.0.0",
  migrateOnVersionChange: true,
};

// Create versioned store
const useVersionedStore = create(
  withStorage(
    (set, get) => ({
      // Store implementation
    }),
    versionedConfig
  )
);

// Check current version
const currentVersion = await storage.get("version");
console.log("Current storage version:", currentVersion);
```

### Version Migration Chain

```typescript
// Define migration chain
const migrations = [
  {
    fromVersion: "1.0.0",
    toVersion: "1.1.0",
    migrate: (data) => ({ ...data, field1: "new" }),
  },
  {
    fromVersion: "1.1.0",
    toVersion: "1.2.0",
    migrate: (data) => ({ ...data, field2: "new" }),
  },
  {
    fromVersion: "1.2.0",
    toVersion: "2.0.0",
    migrate: (data) => ({ ...data, field3: "new" }),
  },
];

// Add all migrations
const storage = new StorageManager({
  backend: "localStorage",
  version: "2.0.0",
  migrateOnVersionChange: true,
});

migrations.forEach((migration) => storage.addMigration(migration));
```

## Storage Encryption

### Basic Encryption

```typescript
// Configure encrypted storage
const encryptedConfig: StorageConfig = {
  backend: "localStorage",
  version: "1.0.0",
  encryptionKey: "your-secret-key",
};

// Create encrypted store
const useEncryptedStore = create(
  withStorage(
    (set, get) => ({
      // Sensitive data
    }),
    encryptedConfig
  )
);
```

### Custom Encryption

```typescript
// Use custom encryption key
const customEncryptedConfig: StorageConfig = {
  backend: "localStorage",
  version: "1.0.0",
  encryptionKey: process.env.ENCRYPTION_KEY,
};

// Create store with custom encryption
const useCustomEncryptedStore = create(
  withStorage(
    (set, get) => ({
      // Sensitive data with custom encryption
    }),
    customEncryptedConfig
  )
);
```

## Advanced Usage

### Combined Features

```typescript
// Configure storage with all features
const advancedConfig: StorageConfig = {
  backend: "indexedDB",
  version: "2.0.0",
  encryptionKey: "secure-key",
  migrateOnVersionChange: true,
  prefix: "app_",
};

// Create advanced store
const useAdvancedStore = create(
  withStorage(
    (set, get) => ({
      // Store implementation
    }),
    advancedConfig
  )
);
```

### Custom Storage Backend

```typescript
// Implement custom storage backend
class CustomStorageBackend implements StorageBackendInterface {
  async get(key: string): Promise<any> {
    // Custom implementation
  }

  async set(key: string, value: any): Promise<void> {
    // Custom implementation
  }

  // Implement other required methods
}

// Use custom backend
const customConfig: StorageConfig = {
  backend: "custom",
  version: "1.0.0",
};

const storage = new StorageManager(customConfig);
```

## Best Practices

1. **Choose Appropriate Backend**

```typescript
// Use localStorage for small data
const smallDataConfig: StorageConfig = {
  backend: "localStorage",
  version: "1.0.0",
};

// Use IndexedDB for large data
const largeDataConfig: StorageConfig = {
  backend: "indexedDB",
  version: "1.0.0",
};
```

2. **Handle Migration Errors**

```typescript
try {
  await storage.migrate(data, fromVersion);
} catch (error) {
  console.error("Migration failed:", error);
  // Handle error (e.g., fallback to default state)
}
```

3. **Secure Encryption**

```typescript
// Use environment variables for encryption keys
const secureConfig: StorageConfig = {
  backend: "localStorage",
  version: "1.0.0",
  encryptionKey: process.env.STORAGE_ENCRYPTION_KEY,
};
```

4. **Version Management**

```typescript
// Keep track of versions
const VERSIONS = {
  CURRENT: "2.0.0",
  PREVIOUS: "1.0.0",
} as const;

const versionedConfig: StorageConfig = {
  backend: "localStorage",
  version: VERSIONS.CURRENT,
  migrateOnVersionChange: true,
};
```

## Troubleshooting

1. **Storage Errors**

```typescript
try {
  await storage.set("key", value);
} catch (error) {
  console.error("Storage error:", error);
  // Handle error (e.g., clear storage, retry)
}
```

2. **Migration Issues**

```typescript
// Debug migration
const debugMigration: StorageMigration = {
  fromVersion: "1.0.0",
  toVersion: "1.1.0",
  migrate: (data) => {
    console.log("Before migration:", data);
    const result = transformData(data);
    console.log("After migration:", result);
    return result;
  },
};
```

3. **Encryption Problems**

```typescript
// Test encryption
const testEncryption = async () => {
  const testData = { test: "data" };
  const encrypted = await storage.encryption?.encrypt(testData);
  const decrypted = await storage.encryption?.decrypt(encrypted);
  console.log("Encryption test:", testData, decrypted);
};
```

4. **Version Conflicts**

```typescript
// Handle version conflicts
const handleVersionConflict = async () => {
  const currentVersion = await storage.get("version");
  if (currentVersion !== storage.config.version) {
    console.warn("Version mismatch detected");
    // Handle version conflict
  }
};
```
