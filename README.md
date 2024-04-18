# geRx - Global Event Reactive Extensions Command Line Interface

geRx-CLI is a command line interface for angular projects using [geRx](https://www.npmjs.com/package/gerx).

---

```
gerx generate <name> [--store]
```


##### Example

`Command`
```
gerx g example
```

`Result`
```
./fasades/example.facade.ts
./services/example.service.ts
./states/example.state.ts
```

`Command`
```
gerx g example --store
```

`Result`
```
./store/example.facade.ts
./store/example.service.ts
./store/example.state.ts
```