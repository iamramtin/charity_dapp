use anchor_lang::prelude::*;

declare_id!("snzkbbcZPg9Jtgk1VfxwKjYaRePtKqsTkM9rRuei1Ci");

#[program]
pub mod charity_dapp {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
