import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

import Mailer from '../../../src/loaders/nodemailer';
import MailerService from '../../../src/services/mailer';

const { expect } = chai;

chai.use(sinonChai);
chai.use(chaiAsPromised);

const sandbox = sinon.createSandbox();
const userEmail = 'disdegnosi@dunsoi.com'; // generated from https://emailfake.com/
const mailService = new MailerService(userEmail);
const codeOrToken = 'lohSh9ZeYoowievuCash1DahquaiMiko';

describe('src/services/mail: class MailerService', () => {
  afterEach(() => {
    sandbox.restore();
  });

  context('sendWelcomeEmail()', () => {
    let mailerSendStub: sinon.SinonStub;

    beforeEach(() => {
      mailerSendStub = sandbox.stub(Mailer, 'send');
    });

    it('should send mail to given email', async () => {
      mailerSendStub.resolves({ status: 'success' });
      const welcomeEmailResponse = mailService.sendWelcomeEmail(codeOrToken);

      await expect(welcomeEmailResponse).to.eventually.be.fulfilled.with.deep.property('status').to.equal('success');
      expect(mailerSendStub).to.have.been.calledOnceWith(userEmail);
    });

    it('should catch errors from loader class', async () => {
      mailerSendStub.rejects({ status: 'error' });
      const welcomeEmailResponse = mailService.sendWelcomeEmail(codeOrToken);

      await expect(welcomeEmailResponse).to.eventually.be.rejected.with.deep.property('status').to.equal('error');
      expect(mailerSendStub).to.have.been.calledOnceWith(userEmail);
    });
  });

  context('sendResetPasswordEmail()', () => {
    let mailerSendStub: sinon.SinonStub;

    beforeEach(() => {
      mailerSendStub = sandbox.stub(Mailer, 'send');
    });

    it('should send mail to given email', async () => {
      mailerSendStub.resolves({ status: 'success' });
      const resetEmailResponse = mailService.sendResetPasswordEmail(codeOrToken);

      await expect(resetEmailResponse).to.eventually.be.fulfilled.with.deep.property('status').to.equal('success');
      expect(mailerSendStub).to.have.been.calledOnceWith(userEmail);
    });

    it('should catch errors from loader class', async () => {
      mailerSendStub.rejects({ status: 'error' });
      const resetEmailResponse = mailService.sendResetPasswordEmail(codeOrToken);

      await expect(resetEmailResponse).to.eventually.be.rejected.with.deep.property('status').to.equal('error');
      expect(mailerSendStub).to.have.been.calledOnceWith(userEmail);
    });
  });
});
