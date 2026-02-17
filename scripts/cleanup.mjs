import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Database Cleanup Started ---')

    try {
        // Delete in correct order to respect foreign keys
        await prisma.session.deleteMany({})
        await prisma.account.deleteMany({})
        await prisma.user.deleteMany({})

        console.log('✅ Successfully cleared User, Account, and Session tables.')
        console.log('You can now log in with Google to create your fresh Admin account.')
    } catch (error) {
        console.error('❌ Error clearing database:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
