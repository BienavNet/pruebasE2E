import {test, expect} from '@playwright/test'

const MOCK = {
    "name": "John Doe",
    "position": "Senior Developer",
    "salary": 5000000
}

const UPDATE_MODK = {
    "name": "Juan Perez",
    "salary": 6000000
}

function formatToCurrency(amount: number): string {
    // 1. Usa Intl.NumberFormat para manejar la localización de comas y puntos.
    // 'en-US' es común para formatos con '$' y coma como separador de miles.
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD', // Usa 'USD' si el símbolo es '$'
        minimumFractionDigits: 0, // Asegura que no haya decimales
        maximumFractionDigits: 0,
    });
    
    return formatter.format(amount);
}

test.describe.configure({ mode: 'serial' });

test.describe("Employees CRUD Test", () => {

    test("Register New Employee", async ({page}) => {
        await page.goto(`/dashboard`)
        await (await page.waitForSelector('a:has-text("Nuevo Empleado")', {state: "attached"})).click()
        await (await page.waitForSelector("input[placeholder='Ingrese el nombre del empleado']", {state: "attached"})).fill(MOCK.name)
        await (await page.waitForSelector("input[placeholder='Ingrese la posición del empleado']", {state: "attached"})).fill(MOCK.position)
        await (await page.waitForSelector("input[placeholder='Ingrese el salario']", {state: "attached"})).fill(`${MOCK.salary}`)
        await (await page.waitForSelector("button:has-text('Crear Empleado')", {state: "attached"})).click()
        
        const response = await page.$("p:has-text('No hay empleados registrados.')")
        await expect(response).toBeNull()
    })

    test("Employee List Table", async ({page}) => {
        
        await page.goto(`/employees`)
        await page.waitForSelector("tbody", {state: "attached"})
        const tbody = await page.locator("tbody")
        const trList = await tbody.locator('tr').all()
        await expect(trList.length).toBeGreaterThan(0)
    })
    
    test("Update Employee", async ({page}) => {
        await page.goto(`/employees`)
        await page.waitForSelector(`tbody tr`, {state: "attached"})
        await (await page.locator(`tbody tr`).locator("td a:has-text('Editar')")).click()
        await (await page.waitForSelector("input[placeholder='Ingrese el nombre del empleado']", {state: 'attached'})).fill(UPDATE_MODK.name)
        await (await page.waitForSelector("input[placeholder='Ingrese el salario']", {state: "attached"})).fill(`${UPDATE_MODK.salary}`)
        await (await page.waitForSelector("button:has-text('Actualizar Empleado')", {state: "attached"})).click()
        const table = await page.locator('tbody tr').first()
    
        await expect(table.locator('td').nth(1)).toHaveText(UPDATE_MODK.name)
        await expect(table.locator('td').nth(3)).toHaveText(formatToCurrency(UPDATE_MODK.salary))
    
    })
    
    test("Delete Employee", async ({page}) => {
        await page.goto(`/employees`)
        await page.waitForSelector(`tbody tr`, {state: "attached"})
        page.on("dialog", async (dialog) => {
            await expect(dialog.type()).toBe('confirm')
            await dialog.accept()
        })
        
        await (await page.locator('tbody tr').locator('td button:has-text("Eliminar")')).click()
        // const response = await page.locator('table')
        // await expect(response).toBe(null)
        await expect(page.locator("p:has-text('No hay empleados registrados.')")).toBeVisible();
    })

    test("Checking Error Messages", async ({page}) => {
        await page.goto(`/employees/new`)
        await page.waitForSelector("input[placeholder='Ingrese el nombre del empleado']", {state: "attached"})
        const nameInput = await page.locator("input[placeholder='Ingrese el nombre del empleado']")
        await nameInput.focus()
        await nameInput.blur()

        const nameErrorDiv = await page.locator("div[class='field-error']")
        await expect(nameErrorDiv).toHaveCount(1)
        
        await expect(await nameErrorDiv.innerText()).toContain('name es requerido')
        await nameInput.fill(MOCK.name)

        const nameErrorDivClean = await page.locator("div[class='field-error']")


        await expect(nameErrorDivClean).toHaveCount(0)

        await page.waitForSelector("input[placeholder='Ingrese el salario']", {state: "attached"})

        const salaryInput = await page.locator("input[placeholder='Ingrese el salario']")
        await salaryInput.fill(`-${MOCK.salary}`)
        await salaryInput.blur()
        const salaryErrorDiv = await page.locator("div[class='field-error']")
        await expect(salaryErrorDiv).toHaveCount(1)
        await expect(await salaryErrorDiv.innerText()).toContain("salary debe ser mayor o igual a 0")
        await salaryInput.fill(`${MOCK.salary}`)
        const salaryErrorDivClean = await page.locator("div[class='field-error']")
        await expect(salaryErrorDivClean).toHaveCount(0)

    })
})
